import os

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Plataforma Cuidados Paliativos ULSBA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
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