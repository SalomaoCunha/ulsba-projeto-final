import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.schemas import LoginDados, TokenResposta, UtilizadorAtual

from fastapi.security import OAuth2PasswordBearer

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRA_MINUTOS = 60

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResposta)
def login(dados: LoginDados, conn=Depends(get_conn)):
    query = """
        SELECT id, password_hash, perfil, ativo FROM utilizador WHERE lower(email) = lower(%s)
    """

    utilizador = conn.execute(query, (dados.email,)).fetchone()

    if not utilizador or utilizador["ativo"] == False:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    senha_correta = bcrypt.checkpw(dados.password.encode(), utilizador["password_hash"].encode())

    if not senha_correta:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")


    payload = {
        "sub": str(utilizador["id"]),   # "sub" tem de ser string, é convenção do JWT
        "perfil": utilizador["perfil"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRA_MINUTOS),
    }


    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

   
    return {"access_token": token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), conn=Depends(get_conn)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
         raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    utilizador_id = int(payload["sub"])

    query = """
        SELECT id, nome, perfil, ativo, vista_geral FROM utilizador WHERE id = %s
    """

    utilizador_check = conn.execute(query, (utilizador_id,)).fetchone()

    if not utilizador_check or not utilizador_check["ativo"]:
        raise HTTPException(status_code=401, detail="Utilizador inválido ou inativo")

    return utilizador_check


@router.get("/me", response_model=UtilizadorAtual)
def eu(utilizador: dict = Depends(get_current_user)):
    return utilizador


