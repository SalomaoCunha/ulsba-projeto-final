from datetime import date, datetime, time
from typing import Optional
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import (
    VisitaAgendaResumo,
    VisitaHorariosReaisAtualizar,
    VoltaCriar,
    VoltaHorariosReaisAtualizar,
    VoltaResumo,
)
from app.services.horarios_volta import (
    HORA_LIMITE_BEJA_PADRAO,
    VisitaAgendaItem,
    ajustar_por_atraso_saida,
    ajustar_por_atraso_visita,
    calcular_resumo_volta,
)

router = APIRouter(prefix="/voltas", tags=["voltas"])

LISBOA = ZoneInfo("Europe/Lisbon")


def _obter_hora_limite_beja(conn) -> time:
    row = conn.execute(
        """
        SELECT valor
        FROM parametro_sistema
        WHERE chave IN ('HORA_LIMITE_REGRESSO_BEJA', 'HORARIO_FIM_VISITAS')
          AND valido_desde <= now()
        ORDER BY CASE WHEN chave = 'HORA_LIMITE_REGRESSO_BEJA' THEN 0 ELSE 1 END,
                 valido_desde DESC
        LIMIT 1
        """
    ).fetchone()

    if row and row.get("valor"):
        try:
            partes = str(row["valor"]).strip().split(":")
            return time(int(partes[0]), int(partes[1]))
        except (ValueError, IndexError):
            pass

    return HORA_LIMITE_BEJA_PADRAO


def _carregar_visitas_para_ajuste(volta_id: int, conn) -> list[VisitaAgendaItem]:
    linhas = conn.execute(
        """
        SELECT vis.id AS visita_id,
               p.ordem AS paragem_ordem,
               vis.estado,
               vis.inicio_previsto,
               vis.fim_previsto,
               vis.inicio_real,
               vis.fim_real
        FROM paragem p
        JOIN visita vis ON vis.paragem_id = p.id
        WHERE p.volta_id = %s
        ORDER BY p.ordem, vis.inicio_previsto NULLS LAST, vis.id
        """,
        (volta_id,),
    ).fetchall()

    return [
        VisitaAgendaItem(
            visita_id=linha["visita_id"],
            paragem_ordem=linha["paragem_ordem"],
            estado=linha["estado"],
            inicio_previsto=linha["inicio_previsto"],
            fim_previsto=linha["fim_previsto"],
            inicio_real=linha["inicio_real"],
            fim_real=linha["fim_real"],
        )
        for linha in linhas
    ]


@router.get("", response_model=list[VoltaResumo])
def listar(
    data_inicio: date,
    data_fim: date,
    equipa_id: Optional[int] = None,
    viatura_id: Optional[int] = None,
    profissional_id: Optional[int] = None,
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

    if profissional_id is not None:
        condicoes.append("""
            v.equipa_id IN (
                SELECT em_prof.equipa_id
                FROM equipa_membro em_prof
                WHERE em_prof.profissional_id = %s AND em_prof.valido_ate IS NULL
            )
        """)
        parametros.append(profissional_id)

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


@router.get("/visitas", response_model=list[VisitaAgendaResumo])
def listar_visitas(
    data_inicio: date,
    data_fim: date,
    utente_id: Optional[int] = None,
    profissional_id: Optional[int] = None,
    estado: Optional[str] = None,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    base = """
        SELECT vis.id AS visita_id,
               v.id AS volta_id,
               v.data AS data_volta,
               v.estado AS volta_estado,
               vis.utente_id,
               u.nome AS utente_nome,
               u.numero_utente AS utente_numero,
               vis.estado AS visita_estado,
               vis.inicio_previsto,
               vis.fim_previsto,
               vis.inicio_real,
               vis.fim_real,
               e.codigo AS equipa_codigo,
               vi.matricula AS viatura_matricula,
               l.nome AS local_nome,
               l.morada AS local_morada
        FROM visita vis
        JOIN paragem p ON p.id = vis.paragem_id
        JOIN volta v ON v.id = p.volta_id
        JOIN utente u ON u.id = vis.utente_id
        JOIN local l ON l.id = p.local_id
        LEFT JOIN equipa e ON e.id = COALESCE(vis.equipa_executante_id, v.equipa_id)
        LEFT JOIN viatura vi ON vi.id = v.viatura_id
    """
    condicoes = ["v.data BETWEEN %s AND %s"]
    parametros = [data_inicio, data_fim]

    if utente_id is not None:
        condicoes.append("vis.utente_id = %s")
        parametros.append(utente_id)

    if profissional_id is not None:
        condicoes.append("""
            COALESCE(vis.equipa_executante_id, v.equipa_id) IN (
                SELECT em_prof.equipa_id
                FROM equipa_membro em_prof
                WHERE em_prof.profissional_id = %s AND em_prof.valido_ate IS NULL
            )
        """)
        parametros.append(profissional_id)

    if estado is not None:
        condicoes.append("vis.estado = %s")
        parametros.append(estado)

    if not utilizador["vista_geral"]:
        condicoes.append("""
            COALESCE(vis.equipa_executante_id, v.equipa_id) IN (
                SELECT em2.equipa_id
                FROM profissional p2
                JOIN equipa_membro em2 ON em2.profissional_id = p2.id AND em2.valido_ate IS NULL
                WHERE p2.utilizador_id = %s
            )
        """)
        parametros.append(utilizador["id"])

    query = (
        base
        + " WHERE "
        + " AND ".join(condicoes)
        + " ORDER BY COALESCE(vis.inicio_previsto, v.partida_prevista), p.ordem"
    )
    return conn.execute(query, parametros).fetchall()


@router.post("", status_code=201)
def criar(dados: VoltaCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    utentes = conn.execute(
        "SELECT id, local_id FROM utente WHERE id = ANY(%s)",
        (dados.utente_ids,),
    ).fetchall()
    local_por_utente = {u["id"]: u["local_id"] for u in utentes}

    agrupado: dict[int, list[int]] = {}

    # A ordem das paragens segue a ordem de dados.utente_ids (ordem de
    # seleção no frontend) — o SELECT acima não garante nenhuma ordem
    # (ANY(%s) não preserva a ordem do array em Postgres), por isso não se
    # pode iterar sobre `utentes` diretamente.
    for utente_id in dados.utente_ids:
        local_id = local_por_utente.get(utente_id)
        if local_id is None:
            continue

        if local_id not in agrupado:
            agrupado[local_id] = []

        agrupado[local_id].append(utente_id)

    # 9:30/16:00 são horas locais de Portugal: têm de ficar associadas ao
    # fuso (Europe/Lisbon), senão o psycopg envia-as "nuas" e o Postgres
    # (sessão em UTC) grava-as como se já fossem UTC — desvio de 1h no
    # horário de verão (DST).
    partida = datetime.combine(dados.data, time(9, 30), tzinfo=LISBOA)
    regresso = datetime.combine(dados.data, time(16, 0), tzinfo=LISBOA)

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
               v.partida_real, v.regresso_real,
               v.distancia_estimada_km, v.metodo_distancia,
               v.distancia_real_km, v.fonte_distancia_real
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
               p.distancia_desde_anterior_km,
               l.nome AS local_nome, l.morada AS local_morada,
               ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lng,
               vis.id AS visita_id, vis.utente_id, u.nome AS utente_nome,
               vis.estado AS visita_estado,
               vis.inicio_previsto, vis.fim_previsto,
               vis.duracao_estimada_min,
               vis.inicio_real, vis.fim_real,
               vis.duracao_real_min,
               ficha.urgencia_designacao, ficha.urgencia_cor
        FROM paragem p
        JOIN local l ON l.id = p.local_id
        LEFT JOIN visita vis ON vis.paragem_id = p.id
        LEFT JOIN utente u ON u.id = vis.utente_id
        LEFT JOIN vw_utente_ficha ficha ON ficha.utente_id = vis.utente_id
        WHERE p.volta_id = %s
        ORDER BY p.ordem, vis.inicio_previsto NULLS LAST, vis.id
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
                "distancia_desde_anterior_km": (
                    float(linha["distancia_desde_anterior_km"])
                    if linha.get("distancia_desde_anterior_km") is not None
                    else None
                ),
                "visitas": [],
            }

        if linha["visita_id"] is not None:
            paragens[paragem_id]["visitas"].append({
                "visita_id": linha["visita_id"],
                "utente_id": linha["utente_id"],
                "utente_nome": linha["utente_nome"],
                "visita_estado": linha["visita_estado"],
                "inicio_previsto": linha["inicio_previsto"],
                "fim_previsto": linha["fim_previsto"],
                "duracao_estimada_min": linha.get("duracao_estimada_min"),
                "inicio_real": linha["inicio_real"],
                "fim_real": linha["fim_real"],
                "duracao_real_min": (
                    float(linha["duracao_real_min"])
                    if linha.get("duracao_real_min") is not None
                    else None
                ),
                "urgencia_designacao": linha["urgencia_designacao"],
                "urgencia_cor": linha["urgencia_cor"],
            })

    lista_paragens = list(paragens.values())
    hora_limite_beja = _obter_hora_limite_beja(conn)

    volta["paragens"] = lista_paragens
    volta["resumo"] = calcular_resumo_volta(
        data_volta=volta["data"],
        partida_prevista=volta["partida_prevista"],
        regresso_previsto=volta["regresso_previsto"],
        partida_real=volta.get("partida_real"),
        regresso_real=volta.get("regresso_real"),
        distancia_estimada_km=volta.get("distancia_estimada_km"),
        distancia_real_km=volta.get("distancia_real_km"),
        paragens=lista_paragens,
        hora_limite_beja=hora_limite_beja,
    )
    return volta


@router.put("/{volta_id}/horarios-reais")
def registar_horarios_reais_volta(
    volta_id: int,
    dados: VoltaHorariosReaisAtualizar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    if dados.partida_real is None and dados.regresso_real is None:
        raise HTTPException(
            status_code=400,
            detail="Indique pelo menos a hora de saída real ou a hora de regresso real.",
        )

    volta = conn.execute(
        """
        SELECT id, data, estado, partida_prevista, regresso_previsto, partida_real, regresso_real
        FROM volta
        WHERE id = %s
        """,
        (volta_id,),
    ).fetchone()

    if volta is None:
        raise HTTPException(status_code=404, detail="Volta não encontrada")

    nova_partida_real = dados.partida_real if dados.partida_real is not None else volta["partida_real"]
    novo_regresso_real = dados.regresso_real if dados.regresso_real is not None else volta["regresso_real"]

    if nova_partida_real is not None and novo_regresso_real is not None and novo_regresso_real < nova_partida_real:
        raise HTTPException(
            status_code=400,
            detail="O regresso real não pode ser anterior à saída real.",
        )

    hora_limite_beja = _obter_hora_limite_beja(conn)
    novo_regresso_previsto = volta["regresso_previsto"]

    if dados.partida_real is not None and volta["partida_prevista"] is not None:
        visitas = _carregar_visitas_para_ajuste(volta_id, conn)
        try:
            ajuste = ajustar_por_atraso_saida(
                data_volta=volta["data"],
                partida_prevista=volta["partida_prevista"],
                regresso_previsto=volta["regresso_previsto"],
                partida_real_anterior=volta["partida_real"],
                nova_partida_real=dados.partida_real,
                visitas=visitas,
                hora_limite_beja=hora_limite_beja,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        novo_regresso_previsto = ajuste.novo_regresso_previsto

        # Atualiza por ordem inversa para nunca provocar sobreposição transitória no trigger de participantes
        for v_ajustada in reversed(ajuste.visitas_ajustadas):
            conn.execute(
                """
                UPDATE visita
                SET inicio_previsto = %s,
                    fim_previsto = %s
                WHERE id = %s
                """,
                (v_ajustada.inicio_previsto, v_ajustada.fim_previsto, v_ajustada.visita_id),
            )

    novo_estado = volta["estado"]
    if volta["estado"] == "CONFIRMADA" and nova_partida_real is not None:
        novo_estado = "EM_CURSO"

    conn.execute(
        """
        UPDATE volta
        SET partida_real = %s,
            regresso_real = %s,
            regresso_previsto = %s,
            estado = %s
        WHERE id = %s
        """,
        (nova_partida_real, novo_regresso_real, novo_regresso_previsto, novo_estado, volta_id),
    )

    return obter(volta_id, conn, utilizador)


@router.put("/{volta_id}/visitas/{visita_id}/horarios-reais")
def registar_horarios_reais_visita(
    volta_id: int,
    visita_id: int,
    dados: VisitaHorariosReaisAtualizar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    if dados.inicio_real is None and dados.fim_real is None:
        raise HTTPException(
            status_code=400,
            detail="Indique pelo menos o início real ou o fim real da visita.",
        )

    volta = conn.execute(
        """
        SELECT id, data, estado, partida_prevista, regresso_previsto, partida_real, regresso_real
        FROM volta
        WHERE id = %s
        """,
        (volta_id,),
    ).fetchone()

    if volta is None:
        raise HTTPException(status_code=404, detail="Volta não encontrada")

    visitas = _carregar_visitas_para_ajuste(volta_id, conn)
    alvo = next((v for v in visitas if v.visita_id == visita_id), None)
    if alvo is None:
        raise HTTPException(status_code=404, detail="Visita não encontrada nesta volta")

    hora_limite_beja = _obter_hora_limite_beja(conn)

    try:
        ajuste = ajustar_por_atraso_visita(
            data_volta=volta["data"],
            regresso_previsto=volta["regresso_previsto"],
            visita_id=visita_id,
            novo_inicio_real=dados.inicio_real,
            novo_fim_real=dados.fim_real,
            visitas=visitas,
            hora_limite_beja=hora_limite_beja,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Atualiza visitas afetadas em ordem inversa para evitar sobreposição transitória
    for v_ajustada in reversed(ajuste.visitas_ajustadas):
        conn.execute(
            """
            UPDATE visita
            SET inicio_previsto = %s,
                fim_previsto = %s
            WHERE id = %s
            """,
            (v_ajustada.inicio_previsto, v_ajustada.fim_previsto, v_ajustada.visita_id),
        )

    novo_inicio_real = dados.inicio_real if dados.inicio_real is not None else alvo.inicio_real
    novo_fim_real = dados.fim_real if dados.fim_real is not None else alvo.fim_real
    novo_estado = alvo.estado

    if novo_fim_real is not None:
        # Garante a integridade da migração 0003: só passa a CONCLUIDA se houver participantes
        part_count = conn.execute(
            "SELECT count(*) AS total FROM visita_participante WHERE visita_id = %s",
            (visita_id,),
        ).fetchone()["total"]

        if part_count == 0:
            conn.execute(
                """
                INSERT INTO visita_participante (visita_id, profissional_id)
                SELECT %s, vp.profissional_id
                FROM volta_profissional vp
                WHERE vp.volta_id = %s
                ON CONFLICT DO NOTHING
                """,
                (visita_id, volta_id),
            )
            part_count = conn.execute(
                "SELECT count(*) AS total FROM visita_participante WHERE visita_id = %s",
                (visita_id,),
            ).fetchone()["total"]

        if part_count > 0:
            novo_estado = "CONCLUIDA"
        elif novo_estado == "PLANEADA":
            novo_estado = "EM_CURSO"
    elif novo_inicio_real is not None and novo_estado == "PLANEADA":
        novo_estado = "EM_CURSO"

    conn.execute(
        """
        UPDATE visita
        SET inicio_real = %s,
            fim_real = %s,
            estado = %s
        WHERE id = %s
        """,
        (novo_inicio_real, novo_fim_real, novo_estado, visita_id),
    )

    if ajuste.novo_regresso_previsto != volta["regresso_previsto"]:
        conn.execute(
            "UPDATE volta SET regresso_previsto = %s WHERE id = %s",
            (ajuste.novo_regresso_previsto, volta_id),
        )

    return obter(volta_id, conn, utilizador)