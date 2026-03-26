from fastapi import APIRouter

from controllers.chat_controller import chat, stream_chat
from models.schemas import ChatRequest

router = APIRouter(tags=["chat"])


@router.post("/chat")
def chat_endpoint(payload: ChatRequest):
    return chat(payload)


@router.post("/chat/stream")
def stream_chat_endpoint(payload: ChatRequest):
    return stream_chat(payload)
