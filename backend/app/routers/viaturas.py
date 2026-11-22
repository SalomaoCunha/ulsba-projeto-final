from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import UniqueViolation

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import (
    BloqueioViaturaCriar,
    BloqueioViaturaResumo,
    ViaturaCriarEditar,
    ViaturaResumo,
)

router = APIRouter(prefix="/viaturas", tags=["viaturas"])


def _obter_viatura(viatura_id: int, conn):
    # Recarrega uma única viatura (incluindo a equipa a que está associada
    # como viatura habitual, se alguma) depois de uma criação/edição, para
    # a resposta refletir o estado gravado na BD.
    query = """
        SELECT v.id, v.matricula, v.designacao, v.tipo_motorizacao, v.lugares,
               v.autonomia, v.unidade_autonomia, v.estado,
               v.data_ultima_revisao, v.periodicidade_revisao_meses,
               e.codigo AS equipa_codigo
        FROM viatura v
        LEFT JOIN equipa e ON e.viatura_habitual_id = v.id
        WHERE v.id = %s
    """
    return conn.execute(query, (viatura_id,)).fetchone()


def _associar_equipa(viatura_id: int, equipa_codigo: Optional[str], conn):
    # A relação "viatura habitual de uma equipa" é guardada do lado da
    # equipa (equipa.viatura_habitual_id), não da viatura, e é 1:1: uma
    # viatura só pode ser a habitual de uma equipa de cada vez. Por isso,
    # antes de associar a equipa pedida, desassocia primeiro qualquer
    # equipa que atualmente aponte para esta viatura — senão ficariam duas
    # equipas a reivindicar a mesma viatura habitual. Se equipa_codigo vier
    # vazio/None, o resultado é simplesmente remover a associação.
    conn.execute(
        "UPDATE equipa SET viatura_habitual_id = NULL WHERE viatura_habitual_id = %s",
        (viatura_id,),
    )
    if equipa_codigo:
        conn.execute(
            "UPDATE equipa SET viatura_habitual_id = %s WHERE codigo = %s",
            (viatura_id, equipa_codigo),
        )


@router.get("", response_model=list[ViaturaResumo])
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # Lista todas as viaturas da frota, sem distinção por permissão do
    # utilizador — a frota é informação partilhada, só as voltas/visitas é
    # que são filtradas por equipa do utilizador.
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


@router.post("", response_model=ViaturaResumo, status_code=201)
def criar(
    dados: ViaturaCriarEditar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Cria a viatura e, se for indicado um código de equipa, associa-a já
    # como viatura habitual dessa equipa — tudo na mesma transação, para a
    # resposta (via _obter_viatura) já vir com a associação aplicada.
    try:
        with conn.transaction():
            novo_id = conn.execute(
                """
                INSERT INTO viatura (
                    matricula, designacao, tipo_motorizacao, lugares,
                    autonomia, unidade_autonomia, estado,
                    data_ultima_revisao, periodicidade_revisao_meses
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    dados.matricula,
                    dados.designacao,
                    dados.tipo_motorizacao,
                    dados.lugares,
                    dados.autonomia,
                    dados.unidade_autonomia,
                    dados.estado,
                    dados.data_ultima_revisao,
                    dados.periodicidade_revisao_meses,
                ),
            ).fetchone()["id"]

            if dados.equipa_codigo:
                _associar_equipa(novo_id, dados.equipa_codigo, conn)

            viatura = _obter_viatura(novo_id, conn)
    except UniqueViolation as erro:
        raise HTTPException(status_code=409, detail="Já existe uma viatura com esta matrícula.") from erro

    return viatura


@router.get("/bloqueios", response_model=list[BloqueioViaturaResumo])
def listar_bloqueios(
    viatura_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Lista bloqueios (indisponibilidades, ex. manutenção) da frota,
    # filtráveis por viatura e por um intervalo [data_inicio, data_fim].
    # O filtro de intervalo é por sobreposição, não por igualdade: um
    # bloqueio entra na listagem se o seu próprio intervalo
    # [data_inicio, data_fim] intersectar o intervalo pedido — daí comparar
    # "data_fim (do bloqueio) >= data_inicio (pedida)" e
    # "data_inicio (do bloqueio) <= data_fim (pedida)", a condição clássica
    # de sobreposição de dois intervalos fechados.
    condicoes = []
    parametros = []

    if viatura_id is not None:
        condicoes.append("viatura_id = %s")
        parametros.append(viatura_id)

    if data_inicio is not None:
        condicoes.append("data_fim >= %s")
        parametros.append(data_inicio)

    if data_fim is not None:
        condicoes.append("data_inicio <= %s")
        parametros.append(data_fim)

    where = f"WHERE {' AND '.join(condicoes)}" if condicoes else ""

    query = f"""
        SELECT id, viatura_id, data_inicio, data_fim, tipo, motivo
        FROM viatura_bloqueio
        {where}
        ORDER BY data_inicio, id
    """
    return conn.execute(query, parametros).fetchall()


@router.delete("/bloqueios/{bloqueio_id}", status_code=204)
def remover_bloqueio(
    bloqueio_id: int,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Remoção definitiva: um bloqueio não tem valor histórico próprio (ao
    # contrário de uma volta ou de uma pertença a equipa), por isso não há
    # aqui lógica de desativação, só DELETE direto.
    cursor = conn.execute(
        "DELETE FROM viatura_bloqueio WHERE id = %s",
        (bloqueio_id,),
    )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Bloqueio não encontrado")


@router.put("/{viatura_id}", response_model=ViaturaResumo)
def editar(
    viatura_id: int,
    dados: ViaturaCriarEditar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Atualiza os dados da viatura e reaplica a associação à equipa pedida
    # (dados.equipa_codigo é o estado final pretendido, incluindo "nenhuma
    # equipa" quando vier vazio/None — _associar_equipa trata isso como
    # remoção da associação atual).
    try:
        with conn.transaction():
            cursor = conn.execute(
                """
                UPDATE viatura
                SET matricula = %s,
                    designacao = %s,
                    tipo_motorizacao = %s,
                    lugares = %s,
                    autonomia = %s,
                    unidade_autonomia = %s,
                    estado = %s,
                    data_ultima_revisao = %s,
                    periodicidade_revisao_meses = %s
                WHERE id = %s
                """,
                (
                    dados.matricula,
                    dados.designacao,
                    dados.tipo_motorizacao,
                    dados.lugares,
                    dados.autonomia,
                    dados.unidade_autonomia,
                    dados.estado,
                    dados.data_ultima_revisao,
                    dados.periodicidade_revisao_meses,
                    viatura_id,
                ),
            )

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Viatura não encontrada")

            _associar_equipa(viatura_id, dados.equipa_codigo, conn)
            viatura = _obter_viatura(viatura_id, conn)
    except UniqueViolation as erro:
        raise HTTPException(status_code=409, detail="Já existe uma viatura com esta matrícula.") from erro

    return viatura


@router.delete("/{viatura_id}", status_code=200)
def apagar(
    viatura_id: int,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    viatura = conn.execute("SELECT id FROM viatura WHERE id = %s", (viatura_id,)).fetchone()
    if viatura is None:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")

    # fk_volta_viatura_id não tem ON DELETE CASCADE: um DELETE físico falha
    # assim que a viatura tiver qualquer volta associada (mesmo já
    # concluída, por integridade histórica). Só apaga de facto uma viatura
    # sem nenhuma volta; caso contrário, marca-a como INATIVA.
    tem_voltas = conn.execute(
        "SELECT EXISTS(SELECT 1 FROM volta WHERE viatura_id = %s) AS tem",
        (viatura_id,),
    ).fetchone()["tem"]

    if tem_voltas:
        conn.execute("UPDATE viatura SET estado = 'INATIVA' WHERE id = %s", (viatura_id,))
        return {"id": viatura_id, "apagada": False, "desativada": True}

    # Viatura sem qualquer volta associada: pode ser apagada de facto.
    # Antes de apagar, limpa as referências que apontam para ela (a
    # associação como viatura habitual de uma equipa, e os seus próprios
    # bloqueios) para o DELETE não falhar por chave estrangeira.
    conn.execute("UPDATE equipa SET viatura_habitual_id = NULL WHERE viatura_habitual_id = %s", (viatura_id,))
    conn.execute("DELETE FROM viatura_bloqueio WHERE viatura_id = %s", (viatura_id,))
    conn.execute("DELETE FROM viatura WHERE id = %s", (viatura_id,))
    return {"id": viatura_id, "apagada": True, "desativada": False}


@router.post("/{viatura_id}/bloqueios", response_model=BloqueioViaturaResumo, status_code=201)
def criar_bloqueio(
    viatura_id: int,
    dados: BloqueioViaturaCriar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    # Cria um período de indisponibilidade (ex. manutenção) para a viatura.
    existe = conn.execute("SELECT 1 FROM viatura WHERE id = %s", (viatura_id,)).fetchone()
    if existe is None:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")

    # data_fim é opcional no pedido: omitida, assume-se um bloqueio de um
    # único dia (data_fim = data_inicio).
    data_fim = dados.data_fim or dados.data_inicio
    if data_fim < dados.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de fim não pode ser anterior à data de início.",
        )

    return conn.execute(
        """
        INSERT INTO viatura_bloqueio (viatura_id, data_inicio, data_fim, tipo, motivo, criado_por)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, viatura_id, data_inicio, data_fim, tipo, motivo
        """,
        (viatura_id, dados.data_inicio, data_fim, dados.tipo, dados.motivo, utilizador["id"]),
    ).fetchone()