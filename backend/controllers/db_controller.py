from fastapi import UploadFile, HTTPException

from db.connection_manager import connection_manager
from models.schemas import ConnectResponse


async def connect_sqlite(file: UploadFile) -> ConnectResponse:
    if not file.filename or not file.filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Please upload a valid .db SQLite file")

    content = await file.read()
    session = connection_manager.create_sqlite_session(file.filename, content)
    return ConnectResponse(
        session_id=session.session_id,
        db_type="sqlite",
        message="SQLite connected successfully",
    )


def connect_mysql(host: str, user: str, password: str, database: str, port: int) -> ConnectResponse:
    try:
        session = connection_manager.create_mysql_session(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"MySQL connection failed: {exc}") from exc

    return ConnectResponse(
        session_id=session.session_id,
        db_type="mysql",
        message="MySQL connected successfully",
    )
