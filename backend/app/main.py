from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import get_conn
from app.routers import auth, equipas, locais, niveis, ocorrencias, utentes, viaturas, voltas

app = FastAPI(title="ULSBA — Cuidados Domiciliários API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    with get_conn() as conn:
        postgis = conn.execute("SELECT PostGIS_Version()").fetchone()
    return {"status": "ok", "postgis": postgis}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(utentes.router, prefix="/api/v1")
app.include_router(equipas.router, prefix="/api/v1")
app.include_router(viaturas.router, prefix="/api/v1")
app.include_router(voltas.router, prefix="/api/v1")
app.include_router(locais.router, prefix="/api/v1")
app.include_router(niveis.router, prefix="/api/v1")
app.include_router(ocorrencias.router, prefix="/api/v1")