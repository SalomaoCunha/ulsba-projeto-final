# Router de gestão de utentes (CRUD da ficha, prioridade/urgência,
# complexidade, equipa responsável e ativação/inativação). Todos os
# endpoints exigem autenticação (Depends(get_current_user)).
from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import (
    ComplexidadeAlterar,
    CoordenadasAtualizar,
    EquipaResponsavelAlterar,
    PrioridadeAlterar,
    UtenteAtivar,
    UtenteCriar,
    UtenteEditar,
    UtenteInativar,
    UtenteResumo,
    validar_coordenadas_portugal,
)

router = APIRouter(prefix="/utentes", tags=["utentes"])


# LISTAR PACIENTES
# GET /utentes — lista utentes ativos, com filtros opcionais por nome e/ou
# número de utente (pesquisa parcial, case-insensitive via ILIKE).
# Lê da view vw_utente_ficha, que já junta utente + local + urgência atual +
# complexidade atual + equipa responsável atual, para evitar repetir esses
# JOINs em cada query.
@router.get("", response_model=list[UtenteResumo])
def listar(nome: str | None = None, numero: str | None = None, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # RF03/RF07: um utente inativado sai do planeamento por omissão.
    condicoes = ["estado != 'INATIVO'"]
    parametros = []

    if nome:
        condicoes.append("nome ILIKE %s")
        parametros.append(f"%{nome}%")

    if numero:
        condicoes.append("numero_utente ILIKE %s")
        parametros.append(f"%{numero}%")

    where = ""

    if condicoes:
        where = "WHERE " + " AND ".join(condicoes)

    # Nota: as condições/parâmetros são construídos dinamicamente mas sempre
    # com placeholders (%s) passados separadamente ao execute(), nunca
    # interpolados no texto da query — não há risco de SQL injection aqui.
    # ST_Y/ST_X extraem lat/lng do ponto PostGIS (geography) para devolver
    # coordenadas simples ao frontend.
    query = f"""
        SELECT utente_id, numero_utente, nome, idade, estado, genero,
            data_nascimento, contacto_telefonico,
            urgencia_designacao, urgencia_cor,
            complexidade_designacao, equipa_responsavel_codigo,
            ultima_visita,
            morada, codigo_postal, localidade, concelho,
            cuidador_principal_nome,
            situacao_clinica, notas,
            ST_Y(geom::geometry) AS lat,
            ST_X(geom::geometry) AS lng
        FROM vw_utente_ficha
        {where}
        ORDER BY nome
    """

    return conn.execute(query, parametros).fetchall()


# FICHA INDIVIDUAL DE CADA PACIENTE
# GET /utentes/{utente_id} — ficha completa de um único utente (mesmos
# campos da listagem, mas sem filtro de estado: também devolve utentes
# inativos, para se poder consultar o histórico/ficha de quem já teve alta).
@router.get("/{utente_id}", response_model=UtenteResumo)
def obter(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT utente_id, numero_utente, nome, idade, estado, genero,
            data_nascimento, contacto_telefonico,
            urgencia_designacao, urgencia_cor,
            complexidade_designacao, equipa_responsavel_codigo,
            ultima_visita,
            morada, codigo_postal, localidade, concelho,
            cuidador_principal_nome,
            situacao_clinica, notas,
            ST_Y(geom::geometry) AS lat,
            ST_X(geom::geometry) AS lng
        FROM vw_utente_ficha
        WHERE utente_id = %s
        ORDER BY nome
    """

    result = conn.execute(query, (utente_id,)).fetchone()

    if result is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return result


# POST /utentes — cria um novo utente associado a um local já existente
# (local_id). criado_por regista quem o criou (vem do utilizador autenticado,
# não do corpo do pedido). Devolve a ficha completa chamando obter()
# diretamente em vez de duplicar a query de leitura.
@router.post("", response_model=UtenteResumo, status_code=201)
def criar(dados: UtenteCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    novo_id = conn.execute(
        """
           INSERT INTO utente (numero_utente, nome, genero, data_nascimento, local_id,
                                contacto_telefonico, situacao_clinica, notas, criado_por)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id
        """,
        (
            dados.numero_utente,
            dados.nome,
            dados.genero,
            dados.data_nascimento,
            dados.local_id,
            dados.contacto_telefonico,
            dados.situacao_clinica,
            dados.notas,
            utilizador["id"],
        ),
    ).fetchone()["id"]

    return obter(novo_id, conn, utilizador)


# PUT /utentes/{utente_id} — edita os dados de contacto/clínicos de um
# utente já existente (campos não presentes em UtenteEditar não são
# alteráveis por aqui; têm endpoints próprios: prioridade, complexidade,
# equipa, estado).
@router.put("/{utente_id}", response_model=UtenteResumo)
def editar(utente_id: int, dados: UtenteEditar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    cursor = conn.execute(
        "UPDATE utente SET nome = %s, contacto_telefonico = %s, situacao_clinica = %s, notas = %s WHERE id = %s",
        (dados.nome, dados.contacto_telefonico, dados.situacao_clinica, dados.notas, utente_id),
    )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return obter(utente_id, conn, utilizador)


# PUT /utentes/{utente_id}/coordenadas — atualiza a localização geográfica
# do utente. Nota: a coordenada não pertence à tabela `utente`, pertence ao
# `local` associado (local_id) — por isso o UPDATE é feito na tabela local,
# não na utente. origem_coordenadas fica marcada como 'MARCADA_NO_MAPA' para
# distinguir de uma coordenada obtida por geocodificação automática.
@router.put("/{utente_id}/coordenadas", response_model=UtenteResumo)
def atualizar_coordenadas(
    utente_id: int,
    dados: CoordenadasAtualizar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    validar_coordenadas_portugal(dados.lat, dados.lng)

    utente = conn.execute(
        "SELECT local_id FROM utente WHERE id = %s",
        (utente_id,),
    ).fetchone()

    if utente is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    # ST_MakePoint(x, y) espera (longitude, latitude) — ordem inversa à
    # intuitiva "lat, lng" — por isso os parâmetros vão (lng, lat).
    conn.execute(
        """
        UPDATE local
        SET geom = ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            origem_coordenadas = 'MARCADA_NO_MAPA'
        WHERE id = %s
        """,
        (dados.lng, dados.lat, utente["local_id"]),
    )

    return obter(utente_id, conn, utilizador)


# POST /utentes/{utente_id}/prioridade — regista uma nova avaliação de
# nível de urgência (RF10). Não faz UPDATE sobre uma avaliação anterior:
# insere uma nova linha em avaliacao_triagem, preservando o histórico
# completo de avaliações (consultável em historico_prioridade). A urgência
# "atual" do utente é derivada pela view vw_utente_ficha a partir da
# avaliação mais recente.
@router.post("/{utente_id}/prioridade", response_model=UtenteResumo, status_code=201)
def alterar_prioridade(utente_id: int, dados: PrioridadeAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
    INSERT INTO avaliacao_triagem (utente_id, nivel_urgencia_id, motivo, avaliada_por)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """

    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()

    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(query, (utente_id, dados.nivel_urgencia_id, dados.motivo, utilizador["id"])).fetchone()["id"]

    return obter(utente_id, conn, utilizador)


# GET /utentes/{utente_id}/historico-prioridade — lista todas as avaliações
# de urgência do utente, mais recente primeiro, com o nome/código/cor do
# nível e quem a registou. retifica_id (quando presente) aponta para uma
# avaliação anterior que esta vem corrigir.
@router.get("/{utente_id}/historico-prioridade")
def historico_prioridade(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT
            t.id,
            t.nivel_urgencia_id,
            n.codigo       AS urgencia_codigo,
            n.designacao   AS urgencia_designacao,
            n.cor_hex      AS urgencia_cor,
            t.motivo,
            t.avaliada_em,
            u.nome         AS avaliada_por_nome,
            t.retifica_id
        FROM avaliacao_triagem t
        JOIN nivel_urgencia n ON n.id = t.nivel_urgencia_id
        JOIN utilizador u      ON u.id = t.avaliada_por
        WHERE t.utente_id = %s
        ORDER BY t.avaliada_em DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de avaliações")

    return result


# POST /utentes/{utente_id}/complexidade — regista uma nova avaliação de
# nível de complexidade, com a mesma lógica de histórico (insert, nunca
# update) usada em alterar_prioridade.
@router.post("/{utente_id}/complexidade", response_model=UtenteResumo, status_code=201)
def alterar_complexidade(utente_id: int, dados: ComplexidadeAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
    INSERT INTO avaliacao_complexidade (utente_id, nivel_complexidade_id, observacao, avaliada_por)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """

    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()

    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(query, (utente_id, dados.nivel_complexidade_id, dados.observacao, utilizador["id"])).fetchone()["id"]

    return obter(utente_id, conn, utilizador)


# GET /utentes/{utente_id}/historico-complexidade — lista todas as
# avaliações de complexidade do utente, mais recente primeiro.
@router.get("/{utente_id}/historico-complexidade")
def historico_complexidade(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT
            t.id,
            t.nivel_complexidade_id,
            n.codigo       AS complexidade_codigo,
            n.designacao   AS complexidade_designacao,
            t.observacao,
            t.avaliada_em,
            u.nome         AS avaliada_por_nome
        FROM avaliacao_complexidade t
        JOIN nivel_complexidade n ON n.id = t.nivel_complexidade_id
        JOIN utilizador u      ON u.id = t.avaliada_por
        WHERE t.utente_id = %s
        ORDER BY t.avaliada_em DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de avaliações")

    return result


# POST /utentes/{utente_id}/equipa — reatribui a equipa responsável pelo
# utente. Ao contrário de prioridade/complexidade (que são sempre apenas
# inseridas), aqui é preciso primeiro "encerrar" a atribuição em vigor
# (valido_ate = now() na linha ainda aberta, isto é, com valido_ate IS NULL)
# antes de inserir a nova — isto mantém um histórico de períodos (valido_desde
# -> valido_ate) sem nunca haver duas atribuições abertas em simultâneo.
@router.post("/{utente_id}/equipa", response_model=UtenteResumo, status_code=201)
def alterar_equipa_responsavel(utente_id: int, dados: EquipaResponsavelAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()
    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(
        """
        UPDATE atribuicao_equipa_responsavel
        SET valido_ate = now()
        WHERE utente_id = %s AND valido_ate IS NULL
        """,
        (utente_id,),
    )

    query = """
            INSERT INTO atribuicao_equipa_responsavel (utente_id, equipa_id, motivo, registada_por)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """

    conn.execute(query, (utente_id, dados.equipa_id, dados.motivo, utilizador["id"])).fetchone()["id"]

    return obter(utente_id, conn, utilizador)


# GET /utentes/{utente_id}/historico-equipa — lista todos os períodos em
# que cada equipa foi responsável pelo utente, mais recente primeiro
# (valido_ate a NULL significa que esse período ainda está em vigor).
@router.get("/{utente_id}/historico-equipa")
def historico_equipa(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT
            a.id,
            a.equipa_id,
            e.codigo       AS equipa_codigo,
            a.valido_desde,
            a.valido_ate,
            a.motivo,
            u.nome         AS registada_por_nome
        FROM atribuicao_equipa_responsavel a
        JOIN equipa e      ON e.id = a.equipa_id
        JOIN utilizador u  ON u.id = a.registada_por
        WHERE a.utente_id = %s
        ORDER BY a.valido_desde DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de equipa responsável")

    return result


# PUT /utentes/{utente_id}/ativar — reativa um utente inativo. Guarda-se a
# transição em utente_transicao_estado (estado_anterior/estado_novo) para
# haver um registo auditável de quando e porquê um utente voltou a ficar
# ativo; data_transicao por omissão é a data atual mas pode ser retroativa.
@router.put("/{utente_id}/ativar", response_model=UtenteResumo)
def ativar(utente_id: int, dados: UtenteAtivar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    utente = conn.execute("SELECT estado FROM utente WHERE id = %s", (utente_id,)).fetchone()
    if utente is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    if utente["estado"] == "ATIVO":
        raise HTTPException(status_code=400, detail="Utente já está ativo")

    data_transicao = dados.data_transicao or date.today()

    conn.execute("UPDATE utente SET estado = 'ATIVO' WHERE id = %s", (utente_id,))

    conn.execute(
        """
        INSERT INTO utente_transicao_estado
            (utente_id, estado_anterior, estado_novo, data_transicao, motivo, registada_por)
        VALUES (%s, %s, 'ATIVO', %s, %s, %s)
        """,
        (utente_id, utente["estado"], data_transicao, dados.motivo, utilizador["id"]),
    )

    return obter(utente_id, conn, utilizador)


# PUT /utentes/{utente_id}/inativar — inativa um utente (ex. alta/óbito).
# RF03/RF07: um utente inativo deixa de aparecer na listagem por omissão e
# sai do planeamento de voltas. Mesma lógica de auditoria da transição que
# em ativar().
@router.put("/{utente_id}/inativar", response_model=UtenteResumo)
def inativar(utente_id: int, dados: UtenteInativar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    utente = conn.execute("SELECT estado FROM utente WHERE id = %s", (utente_id,)).fetchone()
    if utente is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    if utente["estado"] == "INATIVO":
        raise HTTPException(status_code=400, detail="Utente já está inativo")

    data_transicao = dados.data_transicao or date.today()

    conn.execute("UPDATE utente SET estado = 'INATIVO' WHERE id = %s", (utente_id,))

    conn.execute(
        """
        INSERT INTO utente_transicao_estado
            (utente_id, estado_anterior, estado_novo, data_transicao, motivo, registada_por)
        VALUES (%s, %s, 'INATIVO', %s, %s, %s)
        """,
        (utente_id, utente["estado"], data_transicao, dados.motivo, utilizador["id"]),
    )

    return obter(utente_id, conn, utilizador)