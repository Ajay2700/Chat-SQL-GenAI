from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from controllers.db_controller import connect_mysql, connect_sqlite

router = APIRouter(tags=["database"])


@router.post("/connect-db")
async def connect_db(
    db_type: str = Form(...),
    sqlite_file: UploadFile | None = File(default=None),
    host: str | None = Form(default=None),
    user: str | None = Form(default=None),
    password: str | None = Form(default=None),
    database: str | None = Form(default=None),
    port: int = Form(default=3306),
):
    if db_type == "sqlite":
        if sqlite_file is None:
            raise HTTPException(status_code=400, detail="sqlite_file is required for SQLite")
        return await connect_sqlite(sqlite_file)

    if db_type == "mysql":
        if not all([host, user, password, database]):
            raise HTTPException(status_code=400, detail="host, user, password, and database are required for MySQL")
        return connect_mysql(host=host, user=user, password=password, database=database, port=port)

    raise HTTPException(status_code=400, detail="Invalid db_type. Use sqlite or mysql")
