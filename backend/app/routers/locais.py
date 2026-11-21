from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import CoordenadasAtualizar, LocalCriar, validar_coordenadas_portugal

router = APIRouter(prefix="/locais", tags=["locais"])


@router.get("")
def listar(conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT l.id, l.tipo, l.nome, l.morada, l.localidade, c.nome AS concelho,
               ST_Y(l.geom::geometry) AS lat,
               ST_X(l.geom::geometry) AS lng
        FROM local l
        JOIN concelho c ON c.id = l.concelho_id
        WHERE l.ativo = true
        ORDER BY l.localidade, l.morada
    """
    return conn.execute(query).fetchall()


@router.post("", status_code=201)
def criar(dados: LocalCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # A tabela `local` não tem coluna criado_por, por isso não passamos
    # utilizador["id"] para o INSERT (só serve para exigir autenticação).
    if (dados.lat is None) != (dados.lng is None):
        raise HTTPException(
            status_code=400,
            detail="Indica latitude e longitude em conjunto (não apenas uma delas).",
        )

    # ck_local_origem_coordenadas exige que geom e origem_coordenadas sejam
    # ambos nulos ou ambos preenchidos — por isso têm de ser decididos juntos.
    tem_coordenadas = dados.lat is not None and dados.lng is not None

    if tem_coordenadas:
        validar_coordenadas_portugal(dados.lat, dados.lng)
        # ST_MakePoint(x, y) = (longitude, latitude) — ordem inversa à
        # intuitiva de "lat, lng".
        geom_sql = "ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography"
        parametros_geom = [dados.lng, dados.lat]
        origem = "MARCADA_NO_MAPA"
    else:
        geom_sql = "NULL"
        parametros_geom = []
        origem = None

    query = f"""
        INSERT INTO local (tipo, nome, morada, codigo_postal, localidade,
                            concelho_id, contacto_telefonico, geom, origem_coordenadas)
        VALUES (%s, %s, %s, %s, %s, %s, %s, {geom_sql}, %s)
        RETURNING id
    """

    parametros = [
        dados.tipo,
        dados.nome,
        dados.morada,
        dados.codigo_postal,
        dados.localidade,
        dados.concelho_id,
        dados.contacto_telefonico,
        *parametros_geom,
        origem,
    ]

    local_id = conn.execute(query, parametros).fetchone()["id"]

    return {"id": local_id}


@router.put("/{local_id}/coordenadas")
def atualizar_coordenadas(
    local_id: int,
    dados: CoordenadasAtualizar,
    conn=Depends(get_conn),
    utilizador: dict = Depends(get_current_user),
):
    validar_coordenadas_portugal(dados.lat, dados.lng)

    cursor = conn.execute(
        """
        UPDATE local
        SET geom = ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            origem_coordenadas = 'MARCADA_NO_MAPA'
        WHERE id = %s AND ativo = true
        """,
        (dados.lng, dados.lat, local_id),
    )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Local não encontrado")

    return {"id": local_id, "lat": dados.lat, "lng": dados.lng}