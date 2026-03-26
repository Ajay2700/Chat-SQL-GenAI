from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from agents.sql_agent_service import sql_agent_service
from models.schemas import ChatRequest, ChatResponse
from utils.security import safe_error_message


def chat(payload: ChatRequest) -> ChatResponse:
    try:
        result = sql_agent_service.run_query(
            session_id=payload.session_id,
            query=payload.query,
            provider=payload.provider,
            api_key=payload.api_key,
            model=payload.model,
            show_trace=payload.show_trace,
            allow_write=payload.allow_write,
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=safe_error_message(exc)) from exc


def stream_chat(payload: ChatRequest) -> StreamingResponse:
    async def event_generator():
        try:
            async for chunk in sql_agent_service.stream_query(
                session_id=payload.session_id,
                query=payload.query,
                provider=payload.provider,
                api_key=payload.api_key,
                model=payload.model,
                allow_write=payload.allow_write,
            ):
                yield chunk
        except Exception as exc:
            error_text = safe_error_message(exc).replace("\n", " ").replace('"', "'")
            yield f"event:error\ndata:{{\"message\":\"{error_text}\"}}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
