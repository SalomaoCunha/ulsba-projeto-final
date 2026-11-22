from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import UniqueViolation

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import EquipaCriarEditar, EquipaResumo, ProfissionalEquipaResumo

router = APIRouter(prefix="/equipas", tags=["equipas"])

# Base da listagem/detalhe de equipas: uma linha por equipa + membro atual.
# equipa_membro guarda o histórico de pertença a equipas (quem esteve numa
# equipa e quando saiu), por isso o JOIN só traz o membro "em vigor" através
# de valido_ate IS NULL (membros que já saíram ficam com valido_ate
# preenchido e são excluídos aqui). Os LEFT JOIN garantem que uma equipa sem
# membros ainda aparece (com membro_id a NULL), em vez de desaparecer da
# listagem.
_CAMPOS_EQUIPA = """
    SELECT e.id, e.codigo, e.designacao, e.ativa,
           p.id AS membro_id, p.nome AS membro_nome, f.designacao AS funcao
    FROM equipa e
    LEFT JOIN equipa_membro em ON em.equipa_id = e.id AND em.valido_ate IS NULL
    LEFT JOIN profissional p ON p.id = em.profissional_id
    LEFT JOIN funcao_profissional f ON f.id = p.funcao_id
"""


def _agrupar_equipas(linhas):
    # _CAMPOS_EQUIPA devolve uma linha por (equipa, membro) por causa do JOIN
    # a equipa_membro — uma equipa com 3 membros aparece em 3 linhas com os
    # mesmos dados de equipa repetidos. Esta função agrupa essas linhas de
    # volta num dicionário por equipa, com os membros juntos numa lista
    # "membros" (vazia se a equipa não tiver nenhum, caso em que membro_id
    # vem a NULL do LEFT JOIN).
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
        if linha["membro_id"] is not None:
            equipas[equipa_id]["membros"].append({
                "id": linha["membro_id"],
                "nome": linha["membro_nome"],
                "funcao": linha["funcao"],
            })
    return list(equipas.values())


def _obter_equipa(equipa_id: int, conn):
    # Recarrega uma única equipa (com membros atuais) depois de uma
    # criação/edição, para a resposta do endpoint refletir sempre o estado
    # gravado na BD e não os dados ainda em memória do pedido.
    linhas = conn.execute(
        _CAMPOS_EQUIPA + " WHERE e.id = %s ORDER BY e.codigo, p.nome",
        (equipa_id,),
    ).fetchall()
    equipas = _agrupar_equipas(linhas)
    return equipas[0] if equipas else None


def _sincronizar_membros(equipa_id: int, profissional_ids: list[int], conn):
    # Ajusta a composição da equipa para corresponder exatamente à lista
    # `profissional_ids` pedida (usado tanto na criação como na edição):
    # calcula a diferença entre os membros atuais e os pretendidos e só
    # aplica essa diferença (adiciona quem falta, remove quem já não deve
    # estar lá), em vez de apagar tudo e reinserir — isso preservaria
    # incorretamente o histórico de pertença (valido_ate) dos membros que
    # não mudaram.
    if len(profissional_ids) != len(set(profissional_ids)):
        raise HTTPException(status_code=400, detail="A lista de membros contém duplicados.")

    atuais = {
        linha["profissional_id"]
        for linha in conn.execute(
            """
            SELECT profissional_id
            FROM equipa_membro
            WHERE equipa_id = %s AND valido_ate IS NULL
            """,
            (equipa_id,),
        ).fetchall()
    }
    pretendidos = set(profissional_ids)
    adicionar = pretendidos - atuais
    remover = atuais - pretendidos

    if adicionar:
        # Valida que todos os profissionais a adicionar existem e estão
        # ativos — compara o conjunto pedido com o conjunto que a query
        # confirma como ativo; se algum pedido não aparecer aqui (inexistente
        # ou inativo), `ativos != adicionar` deteta a diferença sem precisar
        # de identificar qual falhou.
        ativos = {
            linha["id"]
            for linha in conn.execute(
                "SELECT id FROM profissional WHERE ativo = true AND id = ANY(%s)",
                (list(adicionar),),
            ).fetchall()
        }
        if ativos != adicionar:
            raise HTTPException(
                status_code=400,
                detail="Só é possível adicionar profissionais ativos à equipa.",
            )

    if remover:
        # Remoção lógica: fecha o período de pertença (valido_ate = now())
        # em vez de apagar a linha, para o histórico de "quem esteve nesta
        # equipa e durante quanto tempo" se manter consultável.
        conn.execute(
            """
            UPDATE equipa_membro
            SET valido_ate = now()
            WHERE equipa_id = %s AND valido_ate IS NULL AND profissional_id = ANY(%s)
            """,
            (equipa_id, list(remover)),
        )

    for profissional_id in adicionar:
        conn.execute(
            """
            INSERT INTO equipa_membro (equipa_id, profissional_id)
            VALUES (%s, %s)
            """,
            (equipa_id, profissional_id),
        )


def _normalizar_codigo(codigo: str) -> str:
    # Códigos de equipa são sempre guardados em maiúsculas e sem espaços
    # extra, para que o índice único (codigo) não trate "e1" e "E1" como
    # equipas diferentes.
    normalizado = codigo.strip().upper()
    if not normalizado:
        raise HTTPException(status_code=400, detail="O código da equipa é obrigatório.")
    return normalizado


def _normalizar_designacao(designacao: str | None) -> str | None:
    # Uma designação em branco é tratada como "não definida" (NULL), não
    # como uma string vazia.
    if designacao is None:
        return None
    return designacao.strip() or None


@router.get("", response_model=list[EquipaResumo])
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # Quem tem vista_geral (coordenação) vê todas as equipas; quem não tem
    # só vê as equipas de que é atualmente membro (subquery por
    # utilizador_id -> profissional -> equipa_membro em vigor).
    if utilizador["vista_geral"]:
        linhas = conn.execute(_CAMPOS_EQUIPA + " ORDER BY e.codigo, p.nome").fetchall()
    else:
        query = _CAMPOS_EQUIPA + """
            WHERE e.id IN (
                SELECT em2.equipa_id
                FROM profissional p2
                JOIN equipa_membro em2 ON em2.profissional_id = p2.id AND em2.valido_ate IS NULL
                WHERE p2.utilizador_id = %s
            )
            ORDER BY e.codigo, p.nome
        """
        linhas = conn.execute(query, (utilizador["id"],)).fetchall()

    return _agrupar_equipas(linhas)


@router.get("/profissionais", response_model=list[ProfissionalEquipaResumo])
def listar_profissionais(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # Lista todos os profissionais (ativos e inativos, ativos primeiro) para
    # preencher o seletor de membros ao criar/editar uma equipa — não filtra
    # por equipa, é a lista "candidata" completa.
    return conn.execute(
        """
        SELECT p.id, p.nome, f.designacao AS funcao, p.ativo
        FROM profissional p
        JOIN funcao_profissional f ON f.id = p.funcao_id
        ORDER BY p.ativo DESC, p.nome
        """
    ).fetchall()


@router.post("", response_model=EquipaResumo, status_code=201)
def criar(
    dados: EquipaCriarEditar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Cria a equipa e a sua composição inicial de membros numa única
    # transação: se _sincronizar_membros falhar (ex.: membro inativo), o
    # INSERT da equipa é revertido também, evitando equipas "fantasma" sem
    # membros válidos.
    try:
        with conn.transaction():
            equipa_id = conn.execute(
                """
                INSERT INTO equipa (codigo, designacao)
                VALUES (%s, %s)
                RETURNING id
                """,
                (_normalizar_codigo(dados.codigo), _normalizar_designacao(dados.designacao)),
            ).fetchone()["id"]
            _sincronizar_membros(equipa_id, dados.membros, conn)
            equipa = _obter_equipa(equipa_id, conn)
    except UniqueViolation as erro:
        raise HTTPException(status_code=409, detail="Já existe uma equipa com esse código.") from erro

    return equipa


@router.put("/{equipa_id}", response_model=EquipaResumo)
def editar(
    equipa_id: int,
    dados: EquipaCriarEditar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Atualiza os dados da equipa e resincroniza a lista de membros com a
    # enviada no pedido (dados.membros é a lista completa pretendida, não um
    # delta) — tudo dentro da mesma transação.
    try:
        with conn.transaction():
            cursor = conn.execute(
                """
                UPDATE equipa
                SET codigo = %s, designacao = %s
                WHERE id = %s
                """,
                (
                    _normalizar_codigo(dados.codigo),
                    _normalizar_designacao(dados.designacao),
                    equipa_id,
                ),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Equipa não encontrada.")

            _sincronizar_membros(equipa_id, dados.membros, conn)
            equipa = _obter_equipa(equipa_id, conn)
    except UniqueViolation as erro:
        raise HTTPException(status_code=409, detail="Já existe uma equipa com esse código.") from erro

    return equipa


@router.delete("/{equipa_id}", status_code=200)
def apagar(
    equipa_id: int,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Devolve {"apagada": True/False, "desativada": True/False} para o
    # frontend poder distinguir uma remoção definitiva de uma simples
    # desativação e ajustar a mensagem mostrada ao utilizador.
    equipa = conn.execute("SELECT id FROM equipa WHERE id = %s", (equipa_id,)).fetchone()
    if equipa is None:
        raise HTTPException(status_code=404, detail="Equipa não encontrada.")

    # Equipa é referenciada por histórico (membros, utentes atribuídos,
    # voltas) sem ON DELETE CASCADE — um DELETE físico falharia por
    # violação de chave estrangeira assim que houver qualquer atividade
    # real. Só apaga de facto uma equipa sem nenhum vestígio; caso
    # contrário, desativa-a (fica fora das escolhas de equipa disponível,
    # mas preserva o histórico).
    tem_vestigios = conn.execute(
        """
        SELECT
            EXISTS(SELECT 1 FROM equipa_membro WHERE equipa_id = %(id)s)
            OR EXISTS(SELECT 1 FROM atribuicao_equipa_responsavel WHERE equipa_id = %(id)s)
            OR EXISTS(SELECT 1 FROM volta WHERE equipa_id = %(id)s)
            AS tem
        """,
        {"id": equipa_id},
    ).fetchone()["tem"]

    if tem_vestigios:
        conn.execute("UPDATE equipa SET ativa = false WHERE id = %s", (equipa_id,))
        return {"id": equipa_id, "apagada": False, "desativada": True}

    conn.execute("DELETE FROM equipa WHERE id = %s", (equipa_id,))
    return {"id": equipa_id, "apagada": True, "desativada": False}
