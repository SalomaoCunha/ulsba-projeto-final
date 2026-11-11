from fastapi import HTTPException
from fastapi import APIRouter, Depends
from app.schemas import UtenteResumo, UtenteCriar, UtenteEditar


from app.db import get_conn



UTILIZADOR_SISTEMA_ID = 2  # TODO: substituir por auth real quando existir



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

@router.post("", response_model=UtenteResumo, status_code=201)
def criar(dados: UtenteCriar, conn=Depends(get_conn)):
    novo_id = conn.execute(
        """
           INSERT INTO utente (numero_utente, nome, genero, data_nascimento, local_id,
                                contacto_telefonico, situacao_clinica, notas, criado_por)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id
        """,
        (dados.numero_utente, dados.nome, dados.genero, dados.data_nascimento,
         dados.local_id, dados.contacto_telefonico, dados.situacao_clinica,
         dados.notas, UTILIZADOR_SISTEMA_ID),
    ).fetchone()["id"]

    return obter(novo_id, conn)

@router.put("/{utente_id}", response_model=UtenteResumo)
def editar(utente_id: int, dados: UtenteEditar, conn=Depends(get_conn)):
    cursor =  conn.execute(
        "UPDATE utente SET nome = %s, contacto_telefonico = %s, situacao_clinica = %s, notas = %s WHERE id = %s",
        (dados.nome, dados.contacto_telefonico, dados.situacao_clinica, dados.notas, utente_id),
    )
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return obter(utente_id, conn)    

