# Router de dados de referência (tabelas de apoio, praticamente estáticas):
# níveis de urgência e de complexidade, usados para preencher dropdowns no
# frontend e para validar os IDs recebidos em PrioridadeAlterar/
# ComplexidadeAlterar.
from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user

router = APIRouter(prefix="/niveis", tags=["niveis"])


# GET /niveis/urgencia — níveis de urgência/triagem ativos, por ordem de
# gravidade (coluna `ordem`), incluindo a cor usada para os representar na UI.
@router.get("/urgencia")
def listar_urgencia(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    return conn.execute(
        "SELECT id, codigo, designacao, cor_hex, ordem FROM nivel_urgencia WHERE ativo = true ORDER BY ordem"
    ).fetchall()


# GET /niveis/complexidade — níveis de complexidade clínica ativos, pela
# mesma lógica de ordenação do nível de urgência.
@router.get("/complexidade")
def listar_complexidade(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    return conn.execute(
        "SELECT id, codigo, designacao, ordem FROM nivel_complexidade WHERE ativo = true ORDER BY ordem"
    ).fetchall()
