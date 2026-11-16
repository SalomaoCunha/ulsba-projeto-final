from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import ViaturaResumo

router = APIRouter(prefix="/viaturas", tags=["viaturas"])


@router.get("", response_model=list[ViaturaResumo])
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT v.id, v.matricula, v.designacao, v.tipo_motorizacao, v.lugares,
               v.autonomia, v.unidade_autonomia, v.estado,
               v.data_ultima_revisao, v.periodicidade_revisao_meses,
               e.codigo AS equipa_codigo
        FROM viatura v
        LEFT JOIN equipa e ON e.viatura_habitual_id = v.id
        ORDER BY v.matricula
    """

    return conn.execute(query).fetchall()
