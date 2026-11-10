from fastapi import HTTPException
from fastapi import APIRouter, Depends
from app.schemas import UtenteResumo


from app.db import get_conn

router = APIRouter(prefix="/utentes", tags=["utentes"])

# LISTAR PACIENTES 
@router.get("", response_model=list[UtenteResumo])
def listar(nome: str | None = None, numero: str | None = None, conn=Depends(get_conn)):
    condicoes = []
    parametros = []

    if nome: 
        condicoes.append("nome ILIKE %s")
        parametros.append(f"%{nome}%")
    
    if numero: 
        condicoes.append("numero_utente ILIKE %s")
        parametros.append(f"%{numero}%")

    where = ""

    if condicoes:
        where = "WHERE " + " AND ".join(condicoes)
    
    query = f"""
        SELECT utente_id, numero_utente, nome, idade, estado, genero,
            data_nascimento, contacto_telefonico,
            urgencia_designacao, urgencia_cor,
            complexidade_designacao, equipa_responsavel_codigo,
            ultima_visita
        FROM vw_utente_ficha
        {where}
        ORDER BY nome
    """
    
    return conn.execute(query, parametros).fetchall()

#FICHA INDIVIDUAL DE CADA PACIENTE

@router.get("/{utente_id}", response_model=UtenteResumo)
def obter(utente_id: int, conn=Depends(get_conn)):

    query = f"""
        SELECT utente_id, numero_utente, nome, idade, estado, genero,
            data_nascimento, contacto_telefonico,
            urgencia_designacao, urgencia_cor,
            complexidade_designacao, equipa_responsavel_codigo,
            ultima_visita
        FROM vw_utente_ficha
        WHERE utente_id = %s
        ORDER BY nome
    """

    result = conn.execute(query, (utente_id,)).fetchone()


    if result is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return result
