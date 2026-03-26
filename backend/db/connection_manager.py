from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from langchain_community.utilities import SQLDatabase


@dataclass
class SessionConnection:
    session_id: str
    db_type: str
    engine: Engine
    db: SQLDatabase


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, SessionConnection] = {}
        self._sqlite_dir = Path(__file__).resolve().parents[1] / ".data"
        self._sqlite_dir.mkdir(parents=True, exist_ok=True)

    def create_sqlite_session(self, file_name: str, file_bytes: bytes) -> SessionConnection:
        session_id = str(uuid4())
        sqlite_path = self._sqlite_dir / f"{session_id}_{file_name}"
        sqlite_path.write_bytes(file_bytes)
        engine = create_engine(f"sqlite:///{sqlite_path.as_posix()}")
        db = SQLDatabase(engine)
        session = SessionConnection(session_id=session_id, db_type="sqlite", engine=engine, db=db)
        self._connections[session_id] = session
        return session

    def create_mysql_session(self, host: str, user: str, password: str, database: str, port: int = 3306) -> SessionConnection:
        session_id = str(uuid4())

        clean_host = host.strip()
        clean_port = port
        if ":" in clean_host:
            host_part, port_part = clean_host.rsplit(":", 1)
            if port_part.isdigit():
                clean_host = host_part
                clean_port = int(port_part)

        user_enc = quote_plus(user)
        password_enc = quote_plus(password)
        database_enc = quote_plus(database)
        uri = f"mysql+mysqlconnector://{user_enc}:{password_enc}@{clean_host}:{clean_port}/{database_enc}"

        engine = create_engine(uri, pool_pre_ping=True, connect_args={"connection_timeout": 5})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        db = SQLDatabase(engine)
        session = SessionConnection(session_id=session_id, db_type="mysql", engine=engine, db=db)
        self._connections[session_id] = session
        return session

    def get(self, session_id: str) -> SessionConnection:
        session = self._connections.get(session_id)
        if not session:
            raise ValueError("Invalid or expired session_id")
        return session


connection_manager = ConnectionManager()
