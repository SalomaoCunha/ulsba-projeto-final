from app.schemas import PrioridadeAlterar
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

@router.post("/{utente_id}/prioridade", response_model=UtenteResumo, status_code=201)
def alterar_prioridade(utente_id: int, dados: PrioridadeAlterar, conn=Depends(get_conn)):
    query = """
    INSERT INTO avaliacao_triagem (utente_id, nivel_urgencia_id, motivo, avaliada_por)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """

    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()

    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(query, (utente_id, dados.nivel_urgencia_id, dados.motivo, UTILIZADOR_SISTEMA_ID,)).fetchone()["id"]

    return obter(utente_id, conn)       

@router.get("/{utente_id}/historico-prioridade")
def historico_prioridade(utente_id: int, conn=Depends(get_conn)):
    query = """
        SELECT
            t.id,
            t.nivel_urgencia_id,
            n.codigo       AS urgencia_codigo,
            n.designacao   AS urgencia_designacao,
            n.cor_hex      AS urgencia_cor,
            t.motivo,
            t.avaliada_em,
            u.nome         AS avaliada_por_nome,
            t.retifica_id
        FROM avaliacao_triagem t
        JOIN nivel_urgencia n ON n.id = t.nivel_urgencia_id
        JOIN utilizador u      ON u.id = t.avaliada_por
        WHERE t.utente_id = %s
        ORDER BY t.avaliada_em DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de avaliações")
    
    return result 


