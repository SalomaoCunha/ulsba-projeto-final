from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import VoltaResumo

router = APIRouter(prefix="/voltas", tags=["voltas"])

@router.get("", response_model=list[VoltaResumo])
def listar(
    data_inicio: date,
    data_fim: date,
    equipa_id: Optional[int] = None,
    viatura_id: Optional[int] = None,
    estado: Optional[str] = None,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    base = """
        SELECT v.id, v.data, v.designacao, v.estado,
               v.equipa_id, e.codigo AS equipa_codigo,
               v.viatura_id, vi.matricula AS viatura_matricula,
               v.partida_prevista, v.regresso_previsto
        FROM volta v
        LEFT JOIN equipa e ON e.id = v.equipa_id
        LEFT JOIN viatura vi ON vi.id = v.viatura_id
    """
    condicoes = ["v.data BETWEEN %s AND %s"]
    parametros = [data_inicio, data_fim]

    if equipa_id is not None:
        condicoes.append("v.equipa_id=%s")
        parametros.append(equipa_id)

    if viatura_id is not None:
        condicoes.append("v.viatura_id=%s")
        parametros.append(viatura_id)

    if estado is not None:
        condicoes.append("v.estado=%s")
        parametros.append(estado)

    if not utilizador["vista_geral"]:
        condicoes.append("""
        v.equipa_id IN (
            SELECT em2.equipa_id
            FROM profissional p2
            JOIN equipa_membro em2 ON em2.profissional_id = p2.id AND em2.valido_ate IS NULL
            WHERE p2.utilizador_id = %s
        )
        """)
        parametros.append(utilizador["id"])
        
    
    query = base + " WHERE " + " AND ".join(condicoes) + " ORDER BY v.partida_prevista"
    return conn.execute(query, parametros).fetchall()
