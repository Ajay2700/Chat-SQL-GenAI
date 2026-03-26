from pydantic import BaseModel, Field
from typing import Literal


class MySQLConfig(BaseModel):
    host: str
    user: str
    password: str
    database: str
    port: int = 3306


class ConnectResponse(BaseModel):
    session_id: str
    db_type: Literal["sqlite", "mysql"]
    message: str


class ChatRequest(BaseModel):
    session_id: str
    query: str = Field(min_length=1)
    provider: Literal["groq", "openai"] = "groq"
    api_key: str = Field(min_length=1)
    model: str
    show_trace: bool = False
    allow_write: bool = False


class StructuredResponse(BaseModel):
    summary: str
    key_points: list[str] = []
    cautions: list[str] = []
    suggested_followups: list[str] = []


class ChatResponse(BaseModel):
    response: str
    sql_query: str
    data: list[dict]
    trace: list[str] = []
    structured: StructuredResponse | None = None
