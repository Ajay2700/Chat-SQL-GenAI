import re


SQL_OPERATION_PATTERN = re.compile(r"^\s*(select|insert|update|delete|drop|alter|truncate|create|replace|grant|revoke)\b", re.IGNORECASE)
FORBIDDEN_DDL_PATTERN = re.compile(r"\b(drop|alter|truncate|create|replace|grant|revoke)\b", re.IGNORECASE)

PROMPT_INJECTION_PATTERN = re.compile(
    r"\b(ignore previous|ignore above|system prompt|developer message|reveal prompt|jailbreak|bypass|disable safety|act as)\b",
    re.IGNORECASE,
)

IRRELEVANT_TOPIC_PATTERN = re.compile(
    r"\b(joke|poem|story|weather|movie|song|recipe|politics|news|sports|motivation|horoscope|astrology|translate|code in|python script)\b",
    re.IGNORECASE,
)

UNWANTED_QUERY_PATTERN = re.compile(
    r"\b(hi|hello|hey|who are you|what can you do|tell me about yourself|sing|entertain|make me laugh)\b",
    re.IGNORECASE,
)

DB_INTENT_PATTERN = re.compile(
    r"\b(sql|database|db|table|tables|schema|column|columns|row|rows|record|records|count|sum|average|avg|max|min|insert|update|delete|where|join|group by|order by|salary|name|email|id)\b",
    re.IGNORECASE,
)

MAX_QUERY_LENGTH = 500


def normalize_sql(sql: str) -> str:
    cleaned = sql.strip()
    cleaned = cleaned.replace("```sql", "").replace("```", "").strip()
    if "SQLQuery:" in cleaned:
        cleaned = cleaned.split("SQLQuery:", 1)[1].strip()

    match = re.search(r"(?is)\b(select|insert|update|delete)\b[\s\S]*", cleaned)
    if match:
        cleaned = match.group(0).strip()

    cleaned = cleaned.split("\nSQLResult:", 1)[0].strip()
    if ";" in cleaned:
        cleaned = cleaned.split(";", 1)[0]

    lines = []
    for line in cleaned.splitlines():
        if not line.strip():
            continue
        if line.strip().lower().startswith(("this query", "explanation", "note:")):
            break
        lines.append(line)

    return "\n".join(lines).strip().rstrip(";")


def validate_user_query(query: str) -> None:
    if not query or not query.strip():
        raise ValueError("Please enter a valid question.")

    if len(query) > MAX_QUERY_LENGTH:
        raise ValueError("Query too long. Please keep it under 500 characters.")

    if PROMPT_INJECTION_PATTERN.search(query):
        raise ValueError("Request blocked due to unsafe prompt pattern. Please ask a direct database question.")


def validate_query_relevance(query: str, table_names: list[str] | None = None) -> None:
    normalized = query.strip().lower()
    if not normalized:
        raise ValueError("Please enter a valid question.")

    table_names = table_names or []

    schema_tokens: set[str] = set()
    for table in table_names:
        cleaned = table.lower().strip()
        if not cleaned:
            continue
        schema_tokens.add(cleaned)
        schema_tokens.update(part for part in re.split(r"[^a-z0-9_]+", cleaned) if part)

    query_tokens = [token for token in re.findall(r"[a-z0-9_]+", normalized) if token]

    has_table_reference = any(token in schema_tokens for token in query_tokens)
    has_db_intent = bool(DB_INTENT_PATTERN.search(normalized))
    clearly_irrelevant = bool(IRRELEVANT_TOPIC_PATTERN.search(normalized))
    unwanted_prompt = bool(UNWANTED_QUERY_PATTERN.search(normalized))
    very_short = len(query_tokens) <= 2

    if (clearly_irrelevant or unwanted_prompt) and not has_db_intent and not has_table_reference:
        raise ValueError("This assistant handles database queries only. Ask about tables, records, filters, aggregations, or SQL operations.")

    if very_short and not has_db_intent and not has_table_reference:
        raise ValueError("Query is too vague. Mention table/column context, for example: 'show salary of sanjay from users'.")

    if not has_db_intent and not has_table_reference:
        raise ValueError("This assistant is tuned for database questions only. Please ask about tables, records, SQL filters, or analytics.")


def detect_sql_operation(sql: str) -> str:
    match = SQL_OPERATION_PATTERN.search(sql)
    return match.group(1).lower() if match else "unknown"


def validate_sql(sql: str, allow_write: bool) -> str:
    operation = detect_sql_operation(sql)
    if operation == "unknown":
        raise ValueError("Could not determine SQL operation.")

    if FORBIDDEN_DDL_PATTERN.search(sql):
        raise ValueError("DDL and permission-changing SQL are blocked for safety.")

    if operation in {"insert", "update", "delete"} and not allow_write:
        raise ValueError("Write query detected. Enable 'Write Queries' in sidebar to allow data modification.")

    if operation not in {"select", "insert", "update", "delete"}:
        raise ValueError("Only SELECT/INSERT/UPDATE/DELETE are supported.")

    return operation


def safe_error_message(exc: Exception) -> str:
    message = str(exc)

    if "42000" in message or "syntax" in message.lower():
        return "Generated SQL had a syntax issue. Please rephrase the question with table/column hints."
    if "Unknown column" in message:
        return "One or more requested columns were not found. Please verify field names."
    if "doesn't exist" in message or "does not exist" in message:
        return "Requested table was not found in the connected database."
    if "Access denied" in message:
        return "Database authentication failed. Please check user credentials and permissions."

    if len(message) > 240:
        return "Request failed while processing database query. Please try a narrower prompt."

    return message
