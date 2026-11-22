from datetime import date, datetime, time, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

import psycopg
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import (
    VisitaAgendaResumo,
    VisitaCancelar,
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
DURACAO_VISITA_PADRAO_MIN = 30


def _obter_hora_limite_beja(conn) -> time:
    # Hora-limite de regresso a Beja (RF19/RF39) é um parâmetro de sistema
    # configurável, não uma constante fixa no código. parametro_sistema
    # guarda histórico de valores (várias linhas com valido_desde
    # diferentes); por isso filtra-se por "valido_desde <= now()" e
    # escolhe-se o mais recente (valido_desde DESC) — o valor em vigor
    # agora, não todo o histórico. 'HORARIO_FIM_VISITAS' é um nome de chave
    # legado que ainda pode existir em bases de dados mais antigas; a
    # ordenação por CASE garante que, se ambas as chaves existirem,
    # 'HORA_LIMITE_REGRESSO_BEJA' (o nome atual) tem sempre prioridade.
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
            # Valor gravado em formato inesperado (não "HH:MM") — cai para o
            # padrão em vez de rebentar o pedido inteiro por um parâmetro
            # mal configurado.
            pass

    return HORA_LIMITE_BEJA_PADRAO


def _carregar_visitas_para_ajuste(volta_id: int, conn) -> list[VisitaAgendaItem]:
    # Carrega todas as visitas da volta (de todas as paragens) no formato
    # VisitaAgendaItem esperado pelas funções de ajuste de horário do
    # serviço horarios_volta — a conversão linha SQL -> dataclass fica aqui
    # para o serviço continuar sem depender do formato das queries.
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
    # Lista voltas no intervalo [data_inicio, data_fim], com filtros
    # opcionais por equipa/viatura/profissional/estado. O filtro por
    # profissional_id é indireto: não há profissional_id na tabela volta,
    # por isso traduz-se para "a equipa da volta tem este profissional como
    # membro em vigor" via subquery a equipa_membro.
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

    # Scoping por permissão: sem vista_geral, só vê voltas de equipas de que
    # é membro atual — mesmo padrão usado em equipas.listar() e em
    # listar_visitas() abaixo.
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
    # Agenda de visitas (não de voltas): uma linha por visita individual,
    # para calendários/listas onde a unidade relevante é "quem vai a casa
    # de quem e quando", não a volta inteira. equipa_executante_id permite
    # que uma visita concreta seja reatribuída a uma equipa diferente da
    # equipa da volta (ex. troca pontual) — por isso o "dono" da visita para
    # efeitos de filtro/scoping é sempre COALESCE(vis.equipa_executante_id,
    # v.equipa_id): usa a equipa específica da visita se existir, senão cai
    # para a equipa da volta.
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
    # Cria uma volta já em RASCUNHO (fica pendente de confirmação — ver
    # confirmar() abaixo) a partir de uma lista de utentes a visitar: agrupa
    # os utentes por local (várias visitas no mesmo local tornam-se uma
    # única paragem), gera o horário sequencial de cada visita e já atribui
    # a equipa inteira como escala por omissão.
    utentes = conn.execute(
        "SELECT id, local_id FROM utente WHERE id = ANY(%s)",
        (dados.utente_ids,),
    ).fetchall()
    local_por_utente = {u["id"]: u["local_id"] for u in utentes}

    # Agrupa os utentes pelo local onde vivem: utentes no mesmo local_id
    # partilham uma única paragem física (não faz sentido criar duas
    # paragens para a mesma morada).
    agrupado: dict[int, list[int]] = {}

    # A ordem das paragens segue a ordem de dados.utente_ids (ordem de
    # seleção no frontend) — o SELECT acima não garante nenhuma ordem
    # (ANY(%s) não preserva a ordem do array em Postgres), por isso não se
    # pode iterar sobre `utentes` diretamente.
    for utente_id in dados.utente_ids:
        local_id = local_por_utente.get(utente_id)
        if local_id is None:
            # Utente inexistente ou sem local associado — não entra em
            # nenhuma paragem (silenciosamente ignorado, não gera erro 404
            # para não bloquear a criação da volta por um único id inválido).
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

    # Janela horária (RF19/RF39): rejeita criar uma volta cujas visitas, a
    # DURACAO_VISITA_PADRAO_MIN cada a partir da partida, já ultrapassariam a
    # hora-limite de regresso a Beja. Ao contrário do atraso registado numa
    # volta já em curso (esse só avisa, nunca bloqueia — já aconteceu e tem de
    # poder ser registado na mesma), aqui ainda há tempo de ajustar o plano
    # antes de o confirmar, por isso faz sentido recusar já.
    total_visitas = sum(len(utente_ids) for utente_ids in agrupado.values())
    hora_limite = _obter_hora_limite_beja(conn)
    limite = datetime.combine(dados.data, hora_limite, tzinfo=LISBOA)
    fim_previsto_total = partida + timedelta(minutes=total_visitas * DURACAO_VISITA_PADRAO_MIN)
    if fim_previsto_total > limite:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Com {total_visitas} visita(s) de {DURACAO_VISITA_PADRAO_MIN} min cada, esta volta só "
                f"terminaria às {fim_previsto_total.strftime('%H:%M')}, depois da hora-limite de regresso "
                f"a Beja ({hora_limite.strftime('%H:%M')}). Reduz o número de utentes ou cria mais do que "
                f"uma volta."
            ),
        )

    volta_id = conn.execute(
        """
        INSERT INTO volta (data, equipa_id, viatura_id, partida_prevista, regresso_previsto, criada_por)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (dados.data, dados.equipa_id, dados.viatura_id, partida, regresso, utilizador["id"]),
    ).fetchone()["id"]

    # Escala por omissão: a composição atual da equipa (ajustável depois).
    # Sem isto, volta_profissional fica sempre vazia e uma visita nunca
    # consegue passar a CONCLUIDA (exige pelo menos um participante, e o
    # participante é inferido daqui quando não é registado à mão).
    conn.execute(
        """
        INSERT INTO volta_profissional (volta_id, profissional_id)
        SELECT %s, em.profissional_id
        FROM equipa_membro em
        WHERE em.equipa_id = %s AND em.valido_ate IS NULL
        """,
        (volta_id, dados.equipa_id),
    )

    # Horário por visita: sequencial a partir da partida, DURACAO_VISITA_PADRAO_MIN
    # cada uma (ainda não há seleção de duração por utente/paragem, RF39/RF21
    # fora do âmbito essencial). Antes, todas as visitas ficavam com o
    # horário da volta toda (9:30-16:00) repetido — parecia um erro a quem
    # via a ficha ("como é que 3 visitas acontecem todas ao mesmo tempo?")
    # e desencadeava alertas de sobreposição/soma sem sentido no resumo.
    proximo_inicio = partida

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
            inicio_visita = proximo_inicio
            fim_visita = inicio_visita + timedelta(minutes=DURACAO_VISITA_PADRAO_MIN)
            proximo_inicio = fim_visita

            conn.execute(
                """
                INSERT INTO visita (utente_id, paragem_id, equipa_executante_id, estado, inicio_previsto, fim_previsto, criada_por)
                VALUES (%s, %s, %s, 'PLANEADA', %s, %s, %s)
                """,
                (utente_id, paragem_id, dados.equipa_id, inicio_visita, fim_visita, utilizador["id"]),
            )

    return {"id": volta_id}


def _procurar_volta_em_conflito(volta_id: int, campo: str, conn):
    # Devolve a outra volta (CONFIRMADA/EM_CURSO) que partilha a mesma
    # viatura/equipa desta e cujo horário se sobrepõe — para a mensagem de
    # erro poder dizer exatamente qual é o conflito, em vez de só recusar.
    coluna = "viatura_id" if campo == "viatura" else "equipa_id"
    return conn.execute(
        f"""
        SELECT v2.id, v2.partida_prevista, v2.regresso_previsto
        FROM volta v1
        JOIN volta v2
            ON v2.{coluna} = v1.{coluna}
           AND v2.id != v1.id
           AND v2.estado IN ('CONFIRMADA', 'EM_CURSO')
           AND tstzrange(v2.partida_prevista, v2.regresso_previsto)
               && tstzrange(v1.partida_prevista, v1.regresso_previsto)
        WHERE v1.id = %s
        LIMIT 1
        """,  # nosec: `coluna` vem só de uma constante interna, nunca de input do pedido
        (volta_id,),
    ).fetchone()


def _mensagem_conflito_confirmacao(erro: psycopg.Error, volta_id: int, conn) -> str:
    # ex_volta_viatura_sem_sobreposicao / ex_volta_equipa_sem_sobreposicao
    # (migração 0001) só se aplicam a voltas CONFIRMADA/EM_CURSO — por isso
    # só disparam agora, ao confirmar, não na criação em RASCUNHO. Ao
    # contrário dos triggers DEFERRABLE INITIALLY DEFERRED, uma violação de
    # EXCLUDE dá erro imediato no próprio INSERT/UPDATE, não só no commit.
    texto = str(erro)
    if "ex_volta_viatura_sem_sobreposicao" in texto:
        campo = "viatura"
    elif "ex_volta_equipa_sem_sobreposicao" in texto:
        campo = "equipa"
    else:
        return texto.split("\n", 1)[0]

    conflito = _procurar_volta_em_conflito(volta_id, campo, conn)
    if conflito is None:
        return f"Esta {campo} já está confirmada noutra volta com horário sobreposto nesta data."

    inicio = conflito["partida_prevista"].astimezone(LISBOA).strftime("%H:%M")
    fim = conflito["regresso_previsto"].astimezone(LISBOA).strftime("%H:%M")
    return (
        f"Esta {campo} já está confirmada na Volta #{conflito['id']}, das {inicio} às {fim}. "
        f"Ajusta o horário ou escolhe outra {campo} antes de confirmar."
    )


def _commit_ou_erro(conn):
    # get_conn() só faz commit quando a dependência do FastAPI é fechada, o
    # que acontece DEPOIS da resposta HTTP já ter sido enviada ao cliente —
    # uma falha nesse commit (p.ex. um trigger DEFERRABLE INITIALLY DEFERRED
    # como trg_volta_validar_confirmacao, que só corre no COMMIT) fica
    # invisível ao cliente, que recebe sempre 200 mesmo sem nada ter sido
    # gravado. Ao comitar aqui dentro do próprio handler, uma falha é
    # apanhada antes da resposta ser construída e devolvida como erro real.
    try:
        conn.commit()
    except psycopg.Error as erro:
        conn.rollback()
        mensagem = str(erro).split("\n", 1)[0]
        raise HTTPException(status_code=400, detail=mensagem) from erro


@router.put("/{volta_id}/confirmar")
def confirmar(volta_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # ck_volta_confirmada_completa (migração 0001) exige confirmada_por e
    # confirmada_em preenchidos para qualquer estado que não seja
    # RASCUNHO/CANCELADA — sem este passo, nunca é possível avançar uma
    # volta para CONFIRMADA/EM_CURSO/CONCLUIDA.
    volta = conn.execute("SELECT estado FROM volta WHERE id = %s", (volta_id,)).fetchone()
    if volta is None:
        raise HTTPException(status_code=404, detail="Volta não encontrada")
    if volta["estado"] != "RASCUNHO":
        raise HTTPException(status_code=400, detail="Só é possível confirmar uma volta em rascunho")

    try:
        conn.execute(
            """
            UPDATE volta
            SET estado = 'CONFIRMADA', confirmada_por = %s, confirmada_em = now()
            WHERE id = %s
            """,
            (utilizador["id"], volta_id),
        )
    except psycopg.Error as erro:
        conn.rollback()
        raise HTTPException(status_code=409, detail=_mensagem_conflito_confirmacao(erro, volta_id, conn)) from erro

    _commit_ou_erro(conn)

    return obter(volta_id, conn, utilizador)


def _concluir_visitas_pendentes(volta_id: int, conn) -> None:
    # "Marcar como feita" não deve obrigar a fechar cada visita à mão
    # primeiro: fecha aqui, com o horário previsto (assume que decorreu
    # como planeado), qualquer visita que ainda não esteja concluída ou
    # cancelada. Quem precisar de um horário real diferente continua a
    # poder registá-lo antes de concluir, através do formulário da visita —
    # isto só preenche o que ainda não foi preenchido.
    conn.execute(
        """
        UPDATE visita vis
        SET inicio_real = COALESCE(vis.inicio_real, vis.inicio_previsto),
            fim_real = COALESCE(vis.fim_real, vis.fim_previsto),
            estado = 'CONCLUIDA'
        FROM paragem p
        WHERE vis.paragem_id = p.id
          AND p.volta_id = %s
          AND vis.estado NOT IN ('CONCLUIDA', 'CANCELADA')
        """,
        (volta_id,),
    )
    # ck_participacao_minima (migração 0003) exige pelo menos um
    # participante por visita concluída; usa a composição da equipa da
    # volta para quem ainda não tinha participantes registados.
    conn.execute(
        """
        INSERT INTO visita_participante (visita_id, profissional_id)
        SELECT vis.id, vp.profissional_id
        FROM visita vis
        JOIN paragem p ON p.id = vis.paragem_id
        JOIN volta_profissional vp ON vp.volta_id = p.volta_id
        WHERE p.volta_id = %s
          AND NOT EXISTS (SELECT 1 FROM visita_participante x WHERE x.visita_id = vis.id)
        ON CONFLICT DO NOTHING
        """,
        (volta_id,),
    )


@router.put("/{volta_id}/concluir")
def concluir(volta_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # Único botão para "marcar como feita": trata do que for preciso para lá
    # chegar (confirmar se ainda estiver em rascunho, fechar visitas em
    # falta) numa só chamada, em vez de obrigar o utilizador a saber que há
    # 3 passos distintos antes de poder fechar a volta.
    volta = conn.execute("SELECT estado FROM volta WHERE id = %s", (volta_id,)).fetchone()
    if volta is None:
        raise HTTPException(status_code=404, detail="Volta não encontrada")
    if volta["estado"] in ("CONCLUIDA", "CANCELADA"):
        raise HTTPException(status_code=400, detail="Esta volta já está concluída ou cancelada.")

    if volta["estado"] == "RASCUNHO":
        try:
            conn.execute(
                """
                UPDATE volta
                SET estado = 'CONFIRMADA', confirmada_por = %s, confirmada_em = now()
                WHERE id = %s
                """,
                (utilizador["id"], volta_id),
            )
        except psycopg.Error as erro:
            conn.rollback()
            raise HTTPException(status_code=409, detail=_mensagem_conflito_confirmacao(erro, volta_id, conn)) from erro

    _concluir_visitas_pendentes(volta_id, conn)

    conn.execute("UPDATE volta SET estado = 'CONCLUIDA' WHERE id = %s", (volta_id,))
    _commit_ou_erro(conn)

    return obter(volta_id, conn, utilizador)


@router.get("/{volta_id}")
def obter(volta_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # Ficha completa de uma volta: dados da volta + todas as paragens (com
    # coordenadas para o mapa) + todas as visitas de cada paragem + um
    # resumo calculado (durações, distâncias, alertas de coerência,
    # hora-limite de Beja) produzido pelo serviço horarios_volta. Também é
    # reutilizado como função auxiliar (não só como endpoint): confirmar(),
    # concluir(), registar_horarios_reais_volta/visita() e
    # cancelar_visita() chamam-na diretamente no final para devolver a
    # ficha já atualizada, em vez de duplicar esta query de leitura.
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

    # A query devolve uma linha por (paragem, visita) — mesmo padrão de
    # _agrupar_equipas em equipas.py: agrupa-se aqui por paragem_id, com as
    # visitas de cada paragem juntas numa lista.
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
    # Regista a hora real de saída e/ou de regresso da volta. Registar a
    # saída real tardia desencadeia o ajuste em cascata de todas as visitas
    # ainda planeadas (via ajustar_por_atraso_saida) e, se a volta ainda só
    # estava CONFIRMADA, transita-a automaticamente para EM_CURSO — o
    # mesmo pedido que regista a saída real já é o "arranque" da volta, sem
    # precisar de um passo explícito separado.
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

    # Campos não enviados no pedido mantêm o valor já gravado (permite
    # atualizar só a saída, só o regresso, ou os dois).
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

        # Atualiza por ordem inversa para nunca provocar sobreposição transitória no trigger de participantes.
        # Ao avançar os horários previstos um a um na ordem normal (primeiro a visita mais antiga), existiria
        # um instante em que essa visita já teria o novo horário (mais tarde) enquanto a visita seguinte ainda
        # teria o horário antigo — uma sobreposição momentânea que o trigger de validação poderia apanhar
        # indevidamente. Atualizando de trás para a frente, a visita mais tardia muda primeiro para um horário
        # que já não colide com nenhuma outra, e cada UPDATE seguinte nunca cria sobreposição com o que já foi
        # atualizado.
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

    # Transição automática CONFIRMADA -> EM_CURSO: registar uma saída real
    # é, por si só, a confirmação de que a volta já começou.
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
    # Esta volta está tipicamente CONFIRMADA/EM_CURSO quando se regista uma
    # saída real — por isso os triggers adiados de integridade (migração
    # 0003, ex. trg_visita_revalidar_volta) só disparam mesmo aqui, no
    # commit, não nos UPDATE acima. Sem isto, uma violação ficava invisível
    # ao cliente (ver bug já corrigido em confirmar()/concluir()).
    _commit_ou_erro(conn)

    return obter(volta_id, conn, utilizador)


@router.put("/{volta_id}/visitas/{visita_id}/horarios-reais")
def registar_horarios_reais_visita(
    volta_id: int,
    visita_id: int,
    dados: VisitaHorariosReaisAtualizar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Regista o início e/ou fim real de uma visita concreta e propaga o
    # atraso daí resultante para as visitas seguintes da mesma volta (via
    # ajustar_por_atraso_visita). Também trata, nesta única chamada, a
    # transição de estado da visita (PLANEADA -> EM_CURSO -> CONCLUIDA) e a
    # exigência de participantes mínimos antes de poder concluir.
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

    # Atualiza visitas afetadas em ordem inversa para evitar sobreposição
    # transitória — mesma razão explicada em registar_horarios_reais_volta.
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
        # Garante a integridade da migração 0003: só passa a CONCLUIDA se houver participantes.
        part_count = conn.execute(
            "SELECT count(*) AS total FROM visita_participante WHERE visita_id = %s",
            (visita_id,),
        ).fetchone()["total"]

        if part_count == 0:
            # Sem participantes registados explicitamente, assume-se a
            # composição da equipa da volta inteira (volta_profissional) —
            # mesma lógica de fallback usada em _concluir_visitas_pendentes.
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
            # Mesmo sem conseguir garantir participantes (ex. equipa sem
            # membros), um fim real já registado significa, no mínimo, que
            # a visita está em curso — não deve continuar como PLANEADA.
            novo_estado = "EM_CURSO"
    elif novo_inicio_real is not None and novo_estado == "PLANEADA":
        # Só o início real foi registado (ainda sem fim) — a visita passa a
        # EM_CURSO; ck_participacao_minima só se aplica a CONCLUIDA, por
        # isso aqui não é preciso garantir participantes já.
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

    # Propaga o novo regresso previsto da volta só se o atraso desta visita
    # efetivamente o alterou (atraso zero deixa o regresso previsto intacto).
    if ajuste.novo_regresso_previsto != volta["regresso_previsto"]:
        conn.execute(
            "UPDATE volta SET regresso_previsto = %s WHERE id = %s",
            (ajuste.novo_regresso_previsto, volta_id),
        )

    # Mesma razão do _commit_ou_erro em registar_horarios_reais_volta: esta
    # visita pertence normalmente a uma volta CONFIRMADA/EM_CURSO, por isso
    # trg_visita_revalidar_volta (adiado, migração 0003) só valida aqui, no
    # commit — sem isto, uma violação (ex. horário fora do intervalo da
    # volta) ficava invisível ao cliente.
    _commit_ou_erro(conn)

    return obter(volta_id, conn, utilizador)


@router.put("/{volta_id}/visitas/{visita_id}/cancelar")
def cancelar_visita(
    volta_id: int,
    visita_id: int,
    dados: VisitaCancelar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Cancela uma visita individual (não a volta toda) com motivo
    # obrigatório — não ajusta horários de outras visitas: uma visita
    # cancelada simplesmente deixa de contar para os cálculos do resumo
    # (ver calcular_resumo_volta, que ignora visitas CANCELADA).
    visita = conn.execute(
        """
        SELECT vis.id, vis.estado
        FROM visita vis
        JOIN paragem p ON p.id = vis.paragem_id
        WHERE p.volta_id = %s AND vis.id = %s
        """,
        (volta_id, visita_id),
    ).fetchone()
    if visita is None:
        raise HTTPException(status_code=404, detail="Visita não encontrada nesta volta")
    if visita["estado"] in ("CONCLUIDA", "CANCELADA"):
        raise HTTPException(
            status_code=400,
            detail="Só é possível cancelar uma visita planeada ou em curso",
        )
    if not dados.motivo.strip():
        raise HTTPException(status_code=400, detail="Indica o motivo do cancelamento")

    conn.execute(
        "UPDATE visita SET estado = 'CANCELADA', motivo_cancelamento = %s WHERE id = %s",
        (dados.motivo.strip(), visita_id),
    )
    # fn_validar_volta_atual (trigger DEFERRABLE, migração 0003) exige pelo
    # menos uma visita não cancelada numa volta CONFIRMADA/EM_CURSO/CONCLUIDA
    # — cancelar a última visita ativa dessas volta só é detetado aqui, no
    # commit, daí usar o mesmo _commit_ou_erro das outras transições de estado.
    _commit_ou_erro(conn)

    return obter(volta_id, conn, utilizador)