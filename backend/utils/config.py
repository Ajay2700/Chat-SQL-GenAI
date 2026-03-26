import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    default_model: str = os.getenv("DEFAULT_MODEL", "llama-3.3-70b-versatile")
    allowed_origins: list[str] = [
        origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()
    ]
    allowed_origin_regex: str | None = (
        os.getenv("ALLOWED_ORIGIN_REGEX", "").strip()
        or (r"https://.*\.vercel\.app" if os.getenv("VERCEL") else None)
    )


settings = Settings()
