from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user

router = APIRouter(prefix="/niveis", tags=["niveis"])


@router.get("/urgencia")
def listar_urgencia(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    return conn.execute(
        "SELECT id, codigo, designacao, cor_hex, ordem FROM nivel_urgencia WHERE ativo = true ORDER BY ordem"
    ).fetchall()


@router.get("/complexidade")
def listar_complexidade(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    return conn.execute(
        "SELECT id, codigo, designacao, ordem FROM nivel_complexidade WHERE ativo = true ORDER BY ordem"
    ).fetchall()
