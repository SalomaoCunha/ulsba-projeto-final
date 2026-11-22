# Módulo central de acesso à base de dados: não há ORM, as queries são SQL
# direto (psycopg3), por isso este ficheiro só gere a ligação/sessão.
import os

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

# Lida em runtime a partir do ambiente (ver docker-compose) — não tem default
# propositadamente, para falhar de forma explícita se não estiver configurada.
DATABASE_URL = os.getenv("DATABASE_URL")

# Dependency do FastAPI (usada via Depends(get_conn) nos routers): é um
# generator, não uma função normal — o `yield` entrega a ligação ao endpoint
# e, quando o pedido termina, a execução volta para aqui e o `with` fecha a
# ligação (commit automático no fecho se não houver exceção, rollback caso
# contrário). row_factory=dict_row faz com que cada linha devolvida pelas
# queries seja um dict (chave = nome da coluna) em vez de um tuplo posicional.
def get_conn():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL não definida")
    
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        yield conn