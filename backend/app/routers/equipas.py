from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import EquipaResumo

router = APIRouter(prefix="/equipas", tags=["equipas"])


@router.get("", response_model=list[EquipaResumo])
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # TODO 1: se utilizador["perfil"] == "COORDENADOR" (ou tiver vista_geral) -> vê todas as equipas
    #         senão -> só a equipa onde o profissional ligado a este utilizador está atualmente
    #         (JOIN profissional ON profissional.utilizador_id = utilizador["id"]
    #          JOIN equipa_membro ON equipa_membro.profissional_id = profissional.id
    #          WHERE equipa_membro.valido_ate IS NULL)

    # TODO 2: query principal — para cada equipa, os membros atuais:
    #   SELECT e.id, e.codigo, e.designacao, e.ativa,
    #          p.id AS membro_id, p.nome AS membro_nome, f.designacao AS funcao
    #   FROM equipa e
    #   JOIN equipa_membro em ON em.equipa_id = e.id AND em.valido_ate IS NULL
    #   JOIN profissional p ON p.id = em.profissional_id
    #   JOIN funcao_profissional f ON f.id = p.funcao_id
    #   [+ WHERE e.id = %s se for scoping de um só profissional]
    #   ORDER BY e.codigo

    # TODO 3: psycopg devolve uma linha por membro — tens de agrupar por equipa em Python
    #         antes de devolver (um dict por equipa_id, acumulando membros numa lista)
    ...
