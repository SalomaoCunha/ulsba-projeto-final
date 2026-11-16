from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import EquipaResumo

router = APIRouter(prefix="/equipas", tags=["equipas"])


@router.get("", response_model=list[EquipaResumo])
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    campos = """
        SELECT e.id, e.codigo, e.designacao, e.ativa,
               p.id AS membro_id, p.nome AS membro_nome, f.designacao AS funcao
        FROM equipa e
        JOIN equipa_membro em ON em.equipa_id = e.id AND em.valido_ate IS NULL
        JOIN profissional p ON p.id = em.profissional_id
        JOIN funcao_profissional f ON f.id = p.funcao_id
    """

    if utilizador["vista_geral"]:
        linhas = conn.execute(campos + " ORDER BY e.codigo").fetchall()
    else:
        query = campos + """
            WHERE e.id IN (
                SELECT em2.equipa_id
                FROM profissional p2
                JOIN equipa_membro em2 ON em2.profissional_id = p2.id AND em2.valido_ate IS NULL
                WHERE p2.utilizador_id = %s
            )
            ORDER BY e.codigo
        """
        linhas = conn.execute(query, (utilizador["id"],)).fetchall()

    equipas: dict[int, dict] = {}
    for linha in linhas:
        equipa_id = linha["id"]
        if equipa_id not in equipas:
            equipas[equipa_id] = {
                "id": equipa_id,
                "codigo": linha["codigo"],
                "designacao": linha["designacao"],
                "ativa": linha["ativa"],
                "membros": [],
            }
        equipas[equipa_id]["membros"].append({
            "id": linha["membro_id"],
            "nome": linha["membro_nome"],
            "funcao": linha["funcao"],
        })

    return list(equipas.values())
