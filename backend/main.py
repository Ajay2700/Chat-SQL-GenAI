from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.db_routes import router as db_router
from routes.chat_routes import router as chat_router
from utils.config import settings

app = FastAPI(title="AI SQL Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(db_router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
