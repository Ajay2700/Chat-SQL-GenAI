import json
import re
from typing import AsyncGenerator

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import text

from db.connection_manager import connection_manager
from services.llm_service import get_llm
from utils.security import normalize_sql, safe_error_message, validate_query_relevance, validate_sql, validate_user_query


SYSTEM_SUMMARY_PROMPT = ChatPromptTemplate.from_template(
    """
You are a SQL data assistant.
Answer the user's question using only the SQL query result provided.
Be concise, clear, and responsible.
Do not fabricate facts.
Use this exact structure:
- Summary: one short paragraph
- Key Points: 2-4 bullets
- Cautions: 0-2 bullets (if needed)
- Suggested Follow-ups: 2 bullets
Question: {question}
SQL Query: {sql_query}
Rows: {rows}
"""
)

SQL_REPAIR_PROMPT = ChatPromptTemplate.from_template(
    """
You are an expert SQL fixer for {dialect}.
Given the original user question, SQL, and error, return ONLY a corrected SQL query.
Rules:
1) Output only SQL text
2) Use only supported operations: SELECT, INSERT, UPDATE, DELETE
3) No comments, no explanation, no markdown

User Question: {question}
Broken SQL: {sql_query}
Error: {error_text}
"""
)


def _format_response_markdown(structured: dict) -> str:
    summary = structured.get("summary", "")
    key_points = structured.get("key_points", [])
    cautions = structured.get("cautions", [])
    followups = structured.get("suggested_followups", [])

    chunks: list[str] = []
    if summary:
        chunks.append(f"**Summary**\n{summary}")
    if key_points:
        chunks.append("**Key Points**\n" + "\n".join([f"- {item}" for item in key_points]))
    if cautions:
        chunks.append("**Cautions**\n" + "\n".join([f"- {item}" for item in cautions]))
    if followups:
        chunks.append("**Suggested Follow-ups**\n" + "\n".join([f"- {item}" for item in followups]))

    return "\n\n".join(chunks) if chunks else "No analysis available."


class SQLAgentService:
    def _optimize_sql(self, sql_query: str, operation: str) -> tuple[str, bool]:
        cleaned_sql = " ".join(sql_query.split())
        if operation != "select":
            return cleaned_sql, cleaned_sql != sql_query

        has_limit = bool(re.search(r"\blimit\s+\d+\b", cleaned_sql, re.IGNORECASE))
        is_aggregate = bool(re.search(r"\b(count|sum|avg|min|max)\s*\(", cleaned_sql, re.IGNORECASE))
        has_group_by = bool(re.search(r"\bgroup\s+by\b", cleaned_sql, re.IGNORECASE))

        optimized_sql = cleaned_sql
        if not has_limit and not is_aggregate and not has_group_by:
            optimized_sql = f"{cleaned_sql} LIMIT 50"

        return optimized_sql, optimized_sql != sql_query

    def _generate_sql(self, llm, db, query: str, allow_write: bool) -> tuple[str, str, bool]:
        from langchain.chains import create_sql_query_chain
        sql_chain = create_sql_query_chain(llm, db)
        raw_sql = sql_chain.invoke({"question": query})
        sql_query = normalize_sql(raw_sql)
        operation = validate_sql(sql_query, allow_write=allow_write)
        optimized_sql, was_optimized = self._optimize_sql(sql_query, operation)
        operation = validate_sql(optimized_sql, allow_write=allow_write)
        return optimized_sql, operation, was_optimized

    def _repair_sql(self, llm, question: str, sql_query: str, error_text: str, dialect: str, allow_write: bool) -> tuple[str, str]:
        repair_messages = SQL_REPAIR_PROMPT.format_messages(
            dialect=dialect,
            question=question,
            sql_query=sql_query,
            error_text=error_text,
        )
        repaired = llm.invoke(repair_messages).content
        repaired_sql = normalize_sql(repaired)
        repaired_operation = validate_sql(repaired_sql, allow_write=allow_write)
        return repaired_sql, repaired_operation

    def _execute_with_repair(self, session, llm, question: str, sql_query: str, operation: str, allow_write: bool) -> tuple[str, str, list[dict], bool]:
        try:
            with session.engine.connect() as conn:
                if operation == "select":
                    result = conn.execute(text(sql_query))
                    rows = [dict(row) for row in result.mappings().all()]
                else:
                    trans = conn.begin()
                    result = conn.execute(text(sql_query))
                    trans.commit()
                    rows = [{"rows_affected": int(result.rowcount or 0)}]
            return sql_query, operation, rows, False
        except Exception as first_exc:
            repaired_sql, repaired_operation = self._repair_sql(
                llm=llm,
                question=question,
                sql_query=sql_query,
                error_text=str(first_exc),
                dialect=session.db.dialect,
                allow_write=allow_write,
            )
            with session.engine.connect() as conn:
                if repaired_operation == "select":
                    repaired_result = conn.execute(text(repaired_sql))
                    rows = [dict(row) for row in repaired_result.mappings().all()]
                else:
                    trans = conn.begin()
                    repaired_result = conn.execute(text(repaired_sql))
                    trans.commit()
                    rows = [{"rows_affected": int(repaired_result.rowcount or 0)}]
            return repaired_sql, repaired_operation, rows, True

    def _build_structured_response(self, llm, question: str, sql_query: str, rows: list[dict]) -> dict:
        summary_prompt = SYSTEM_SUMMARY_PROMPT.format_messages(
            question=question,
            sql_query=sql_query,
            rows=rows,
        )
        content = llm.invoke(summary_prompt).content

        structure_prompt = ChatPromptTemplate.from_template(
            """
Convert the following assistant response into strict JSON only.
Schema:
{{
  "summary": "string",
  "key_points": ["string"],
  "cautions": ["string"],
  "suggested_followups": ["string"]
}}
Response:
{response_text}
"""
        ).format_messages(response_text=content)

        structured_text = llm.invoke(structure_prompt).content
        try:
            parsed = json.loads(structured_text)
        except Exception:
            parsed = {
                "summary": content,
                "key_points": [],
                "cautions": [],
                "suggested_followups": [],
            }
        return parsed

    def run_query(self, session_id: str, query: str, provider: str, api_key: str, model: str, show_trace: bool, allow_write: bool) -> dict:
        try:
            validate_user_query(query)

            session = connection_manager.get(session_id)
            validate_query_relevance(query, session.db.get_usable_table_names())
            llm = get_llm(provider=provider, api_key=api_key, model=model, streaming=False)

            initial_sql, initial_operation, was_optimized = self._generate_sql(llm, session.db, query, allow_write)
            sql_query, final_operation, rows, repaired = self._execute_with_repair(session, llm, query, initial_sql, initial_operation, allow_write)
            structured = self._build_structured_response(llm, query, sql_query, rows)
            final_response = _format_response_markdown(structured)

            trace: list[str] = []
            if show_trace:
                trace = [
                    f"Initial SQL: {initial_sql}",
                    f"Final SQL: {sql_query}",
                    f"Operation: {final_operation.upper()}",
                    f"Rows returned: {len(rows)}",
                    f"Optimized SQL: {'yes' if was_optimized else 'no'}",
                    f"Auto-repair used: {'yes' if repaired else 'no'}",
                ]

            return {
                "response": final_response,
                "sql_query": sql_query,
                "data": rows,
                "trace": trace,
                "structured": structured,
            }
        except Exception as exc:
            raise ValueError(safe_error_message(exc)) from exc

    async def stream_query(self, session_id: str, query: str, provider: str, api_key: str, model: str, allow_write: bool) -> AsyncGenerator[str, None]:
        try:
            validate_user_query(query)

            session = connection_manager.get(session_id)
            validate_query_relevance(query, session.db.get_usable_table_names())
            sql_llm = get_llm(provider=provider, api_key=api_key, model=model, streaming=False)
            initial_sql, initial_operation, was_optimized = self._generate_sql(sql_llm, session.db, query, allow_write)
            sql_query, final_operation, rows, _ = self._execute_with_repair(session, sql_llm, query, initial_sql, initial_operation, allow_write)

            streaming_llm = get_llm(provider=provider, api_key=api_key, model=model, streaming=True)
            messages = SYSTEM_SUMMARY_PROMPT.format_messages(
                question=query,
                sql_query=sql_query,
                rows=rows,
            )

            meta_payload = {
                "sql_query": sql_query,
                "row_count": len(rows),
                "operation": final_operation,
                "optimized": was_optimized,
            }
            yield f"event:meta\ndata:{json.dumps(meta_payload)}\n\n"
            async for chunk in streaming_llm.astream(messages):
                text_chunk = chunk.content if chunk.content else ""
                if text_chunk:
                    token_payload = {"token": text_chunk}
                    yield f"event:token\ndata:{json.dumps(token_payload)}\n\n"

            payload = {"sql_query": sql_query, "data": rows}
            yield f"event:done\ndata:{json.dumps(payload, default=str)}\n\n"
        except Exception as exc:
            error_payload = {"message": safe_error_message(exc)}
            yield f"event:error\ndata:{json.dumps(error_payload)}\n\n"


sql_agent_service = SQLAgentService()
