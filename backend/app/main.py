# Ponto de entrada da API: cria a app FastAPI, configura CORS e regista
# todos os routers (cada um sob o prefixo comum /api/v1).
import os

import psycopg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import DATABASE_URL
from app.routers import auth, equipas, locais, niveis, ocorrencias, utentes, viaturas, voltas

app = FastAPI(title="ULSBA — Cuidados Domiciliários API")

# Origens do frontend permitidas em CORS: as de desenvolvimento local (Vite)
# estão sempre incluídas; ORIGENS_EXTRA permite acrescentar origens de
# produção/staging via variável de ambiente, sem precisar de alterar código.
ORIGENS_LOCAIS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
ORIGENS_EXTRA = [o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_LOCAIS + ORIGENS_EXTRA,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)


@app.get("/health")
def health():
    # Endpoint de verificação de vida: confirma que a app consegue mesmo
    # ligar-se à BD e que a extensão PostGIS está instalada (devolve a versão).
    # get_conn() é um generator pensado para o Depends() do FastAPI — chamá-lo
    # diretamente (`with get_conn() as conn`) não funciona como context manager.
    with psycopg.connect(DATABASE_URL) as conn:
        postgis = conn.execute("SELECT PostGIS_Version()").fetchone()[0]
    return {"status": "ok", "postgis": postgis}


# Registo dos routers de cada área funcional, todos sob /api/v1.
app.include_router(auth.router, prefix="/api/v1")
app.include_router(utentes.router, prefix="/api/v1")
app.include_router(equipas.router, prefix="/api/v1")
app.include_router(viaturas.router, prefix="/api/v1")
app.include_router(voltas.router, prefix="/api/v1")
app.include_router(locais.router, prefix="/api/v1")
app.include_router(niveis.router, prefix="/api/v1")
app.include_router(ocorrencias.router, prefix="/api/v1")