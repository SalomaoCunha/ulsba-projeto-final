from fastapi import APIRouter, Depends

from app.db import get_conn
from app.routers.auth import get_current_user
from app.schemas import LocalCriar

router = APIRouter(prefix="/locais", tags=["locais"])


@router.post("", status_code=201)
def criar(dados: LocalCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # A tabela `local` não tem coluna criado_por, por isso não passamos
    # utilizador["id"] para o INSERT (só serve para exigir autenticação).

    # ck_local_origem_coordenadas exige que geom e origem_coordenadas sejam
    # ambos nulos ou ambos preenchidos — por isso têm de ser decididos juntos.
    tem_coordenadas = dados.lat is not None and dados.lng is not None

    if tem_coordenadas:
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
