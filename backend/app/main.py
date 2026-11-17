import os

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import utentes, auth, equipas, viaturas, voltas

app = FastAPI(title="Plataforma Cuidados Paliativos ULSBA")

ORIGENS_LOCAIS = ["http://localhost:5173", "http://localhost:5174"]
ORIGENS_EXTRA = [o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_LOCAIS + ORIGENS_EXTRA,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

DATABASE_URL = os.getenv("DATABASE_URL")


@app.get("/health")
def health():
    """Confirma que a API fala com a BD e que o PostGIS está ativo."""
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL não definida")
    with psycopg.connect(DATABASE_URL) as conn:
        postgis = conn.execute("SELECT PostGIS_Version()").fetchone()[0]
    return {"status": "ok", "postgis": postgis}


app.include_router(utentes.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(equipas.router, prefix="/api/v1")
app.include_router(viaturas.router, prefix="/api/v1")
app.include_router(voltas.router, prefix="/api/v1")