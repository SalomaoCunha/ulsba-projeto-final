import os

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL")

def get_conn():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL não definida")
    
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        yield conn