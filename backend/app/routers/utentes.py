from fastapi import APIRouter, Depends

from app.db import get_conn

router = APIRouter(prefix="/utentes", tags=["utentes"])

@router.get("")
def listar(conn=Depends(get_conn)):
    return conn.execute("SELECT 1 AS ok").fetchall()