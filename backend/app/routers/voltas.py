from datetime import date, datetime, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import VoltaResumo, VoltaCriar

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


@router.post("", status_code=201)
def criar(dados: VoltaCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # ANY(%s) é o equivalente a "IN (...)" quando não sabemos antecipadamente
    # quantos ids vamos passar — psycopg converte a lista Python para array SQL.
    utentes = conn.execute(
        "SELECT id, local_id FROM utente WHERE id = ANY(%s)",
        (dados.utente_ids,),
    ).fetchall()

    agrupado: dict[int, list[int]] = {}

    for u in utentes:
        local_id = u["local_id"]
        utente_id = u["id"]

        if local_id not in agrupado:
            agrupado[local_id] = []

        agrupado[local_id].append(utente_id)
    


    partida = datetime.combine(dados.data, time(9, 30))
    regresso = datetime.combine(dados.data, time(16, 0))

    volta_id = conn.execute(
        """
        INSERT INTO volta (data, equipa_id, viatura_id, partida_prevista, regresso_previsto, criada_por)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (dados.data, dados.equipa_id, dados.viatura_id, partida, regresso, utilizador["id"]),
    ).fetchone()["id"]


    for ordem, (local_id, utente_ids) in enumerate(agrupado.items(), start=1):
        paragem_id = conn.execute(
            """
            INSERT INTO paragem (volta_id, ordem, local_id)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (volta_id, ordem, local_id),
        ).fetchone()["id"]

        for utente_id in utente_ids:
            # PROVISÓRIO: cada visita fica com o horário da volta toda (partida/regresso),
            # porque ainda não existe seleção de hora por paragem (RF39/RF21 ficaram de fora
            # do âmbito essencial). ck_visita_planeada_completa exige inicio_previsto/
            # fim_previsto não nulos para estado='PLANEADA'. Corrigir quando houver
            # hora por paragem — ver cartão Trello.
            conn.execute(
                """
                INSERT INTO visita (utente_id, paragem_id, equipa_executante_id, estado, inicio_previsto, fim_previsto, criada_por)
                VALUES (%s, %s, %s, 'PLANEADA', %s, %s, %s)
                """,
                (utente_id, paragem_id, dados.equipa_id, partida, regresso, utilizador["id"]),
            )


    return {"id": volta_id}

@router.get("/{volta_id}")
def obter(volta_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    volta = conn.execute(
        """
        SELECT v.id, v.data, v.designacao, v.estado,
               v.equipa_id, e.codigo AS equipa_codigo,
               v.viatura_id, vi.matricula AS viatura_matricula,
               v.partida_prevista, v.regresso_previsto,
               v.distancia_estimada_km, v.distancia_real_km
        FROM volta v
        LEFT JOIN equipa e ON e.id = v.equipa_id
        LEFT JOIN viatura vi ON vi.id = v.viatura_id
        WHERE v.id = %s
        """,
        (volta_id,),
    ).fetchone()

    if volta is None:
        raise HTTPException(status_code=404, detail="Volta não encontrada")

    linhas = conn.execute(
        """
        SELECT p.id AS paragem_id, p.ordem, p.local_id,
               l.nome AS local_nome, l.morada AS local_morada,
               ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lng,
               vis.id AS visita_id, vis.utente_id, u.nome AS utente_nome,
               vis.estado AS visita_estado,
               vis.inicio_previsto, vis.fim_previsto,
               vis.inicio_real, vis.fim_real,
               ficha.urgencia_designacao, ficha.urgencia_cor
        FROM paragem p
        JOIN local l ON l.id = p.local_id
        LEFT JOIN visita vis ON vis.paragem_id = p.id
        LEFT JOIN utente u ON u.id = vis.utente_id
        LEFT JOIN vw_utente_ficha ficha ON ficha.utente_id = vis.utente_id
        WHERE p.volta_id = %s
        ORDER BY p.ordem
        """,
        (volta_id,),
    ).fetchall()

    paragens = {}

    for linha in linhas:
        paragem_id = linha["paragem_id"]

        if paragem_id not in paragens:
            paragens[paragem_id] = {
                "ordem": linha["ordem"],
                "local_nome": linha["local_nome"],
                "local_morada": linha["local_morada"],
                "lat": linha["lat"],
                "lng": linha["lng"],
                "visitas": [],
            }
        
        paragens[paragem_id]["visitas"].append({
            "visita_id": linha["visita_id"],
            "utente_id": linha["utente_id"],
            "utente_nome": linha["utente_nome"],
            "visita_estado": linha["visita_estado"],
            "inicio_previsto": linha["inicio_previsto"],
            "fim_previsto": linha["fim_previsto"],
            "inicio_real": linha["inicio_real"],
            "fim_real": linha["fim_real"],
            "urgencia_designacao": linha["urgencia_designacao"],
            "urgencia_cor": linha["urgencia_cor"],
        })

    volta["paragens"] = list(paragens.values())
    return volta
    

