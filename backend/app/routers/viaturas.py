from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

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

    return _obter_viatura(novo_id, conn)


@router.get("/bloqueios", response_model=list[BloqueioViaturaResumo])
def listar_bloqueios(
    viatura_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
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

    return _obter_viatura(viatura_id, conn)


@router.post("/{viatura_id}/bloqueios", response_model=BloqueioViaturaResumo, status_code=201)
def criar_bloqueio(
    viatura_id: int,
    dados: BloqueioViaturaCriar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    existe = conn.execute("SELECT 1 FROM viatura WHERE id = %s", (viatura_id,)).fetchone()
    if existe is None:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")

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