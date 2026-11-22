# Router de ocorrências: registos livres (incidentes, atrasos, notas) que
# ficam associados a uma volta ou a uma visita específica.
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import OcorrenciaCriar

router = APIRouter(prefix="/ocorrencias", tags=["ocorrencias"])


# POST /ocorrencias — regista uma nova ocorrência. Tem de estar associada a
# exatamente uma entidade (volta OU visita, nunca as duas nem nenhuma) —
# validado aqui porque o schema OcorrenciaCriar não o consegue expressar
# (ambos os campos são opcionais a nível de tipo).
@router.post("", status_code=201)
def criar(dados: OcorrenciaCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    preenchidos = sum(x is not None for x in [dados.volta_id, dados.visita_id])
    
    if preenchidos != 1:
        raise HTTPException(status_code=400, detail="Indica exatamente um de volta_id ou visita_id")

    # autor_id vem sempre do utilizador autenticado, nunca do corpo do
    # pedido, para não se poder atribuir uma ocorrência a outra pessoa.
    ocorrencia_id = conn.execute(
    """
    INSERT INTO ocorrencia (volta_id, visita_id, tipo_ocorrencia_id, visibilidade, texto, minutos_atraso, autor_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    RETURNING id
    """,
    (dados.volta_id, dados.visita_id, dados.tipo_ocorrencia_id, dados.visibilidade, dados.texto, dados.minutos_atraso, utilizador["id"]),
    ).fetchone()["id"]



    return {"id": ocorrencia_id}


# GET /ocorrencias — lista ocorrências, opcionalmente filtradas por volta
# ou por visita (os dois filtros podem ser combinados), já com o nome do
# tipo e do autor resolvidos via JOIN.
@router.get("")
def listar(volta_id: int | None = None, visita_id: int | None = None, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    condicoes = []
    parametros = []

    if volta_id is not None:
        condicoes.append("o.volta_id = %s")
        parametros.append(volta_id)
    
    if visita_id is not None: 
        condicoes.append("o.visita_id = %s")
        parametros.append(visita_id)

    where = ""

    if condicoes:
        where = "WHERE " + " AND ".join(condicoes)

    query = f"""
        SELECT
            o.id,
            o.volta_id,
            o.visita_id,
            t.codigo        AS tipo_codigo,
            t.designacao    AS tipo_designacao,
            o.visibilidade,
            o.texto,
            o.minutos_atraso,
            o.criada_em,
            u.nome           AS autor_nome
        FROM ocorrencia o
        JOIN tipo_ocorrencia t ON t.id = o.tipo_ocorrencia_id
        JOIN utilizador u      ON u.id = o.autor_id
        {where}
        ORDER BY o.criada_em DESC
    """

    return conn.execute(query, parametros).fetchall()

