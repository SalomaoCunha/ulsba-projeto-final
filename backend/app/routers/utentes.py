from datetime import date
from app.schemas import PrioridadeAlterar, ComplexidadeAlterar, EquipaResponsavelAlterar, UtenteInativar
from fastapi import HTTPException
from fastapi import APIRouter, Depends
from app.schemas import UtenteResumo, UtenteCriar, UtenteEditar


from app.db import get_conn
from app.routers.auth import get_current_user


router = APIRouter(prefix="/utentes", tags=["utentes"])

# LISTAR PACIENTES 
@router.get("", response_model=list[UtenteResumo])
def listar(nome: str | None = None, numero: str | None = None, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    # RF03/RF07: um utente inativado sai do planeamento por omissão.
    condicoes = ["estado != 'INATIVO'"]
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
            ultima_visita,
            morada, codigo_postal, localidade, concelho,
            cuidador_principal_nome,
            ST_Y(geom::geometry) AS lat,
            ST_X(geom::geometry) AS lng
        FROM vw_utente_ficha
        {where}
        ORDER BY nome
    """

    return conn.execute(query, parametros).fetchall()

#FICHA INDIVIDUAL DE CADA PACIENTE

@router.get("/{utente_id}", response_model=UtenteResumo)
def obter(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):

    query = f"""
        SELECT utente_id, numero_utente, nome, idade, estado, genero,
            data_nascimento, contacto_telefonico,
            urgencia_designacao, urgencia_cor,
            complexidade_designacao, equipa_responsavel_codigo,
            ultima_visita,
            morada, codigo_postal, localidade, concelho,
            cuidador_principal_nome,
            ST_Y(geom::geometry) AS lat,
            ST_X(geom::geometry) AS lng
        FROM vw_utente_ficha
        WHERE utente_id = %s
        ORDER BY nome
    """

    result = conn.execute(query, (utente_id,)).fetchone()


    if result is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return result

@router.post("", response_model=UtenteResumo, status_code=201)
def criar(dados: UtenteCriar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    novo_id = conn.execute(
        """
           INSERT INTO utente (numero_utente, nome, genero, data_nascimento, local_id,
                                contacto_telefonico, situacao_clinica, notas, criado_por)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id
        """,
        (dados.numero_utente, dados.nome, dados.genero, dados.data_nascimento,
         dados.local_id, dados.contacto_telefonico, dados.situacao_clinica,
         dados.notas, utilizador["id"]),
    ).fetchone()["id"]

    return obter(novo_id, conn, utilizador)

@router.put("/{utente_id}", response_model=UtenteResumo)
def editar(utente_id: int, dados: UtenteEditar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    cursor =  conn.execute(
        "UPDATE utente SET nome = %s, contacto_telefonico = %s, situacao_clinica = %s, notas = %s WHERE id = %s",
        (dados.nome, dados.contacto_telefonico, dados.situacao_clinica, dados.notas, utente_id),
    )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    return obter(utente_id, conn, utilizador)

@router.post("/{utente_id}/prioridade", response_model=UtenteResumo, status_code=201)
def alterar_prioridade(utente_id: int, dados: PrioridadeAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
    INSERT INTO avaliacao_triagem (utente_id, nivel_urgencia_id, motivo, avaliada_por)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """

    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()

    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(query, (utente_id, dados.nivel_urgencia_id, dados.motivo, utilizador["id"],)).fetchone()["id"]

    return obter(utente_id, conn, utilizador)

@router.get("/{utente_id}/historico-prioridade")
def historico_prioridade(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
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


@router.post("/{utente_id}/complexidade", response_model=UtenteResumo, status_code=201)
def alterar_complexidade(utente_id: int, dados: ComplexidadeAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
    INSERT INTO avaliacao_complexidade (utente_id, nivel_complexidade_id, observacao, avaliada_por)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """

    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()

    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(query, (utente_id, dados.nivel_complexidade_id, dados.observacao, utilizador["id"],)).fetchone()["id"]

    return obter(utente_id, conn, utilizador)

@router.get("/{utente_id}/historico-complexidade")
def historico_complexidade(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT
            t.id,
            t.nivel_complexidade_id,
            n.codigo       AS complexidade_codigo,
            n.designacao   AS complexidade_designacao,
            t.observacao,
            t.avaliada_em,
            u.nome         AS avaliada_por_nome
        FROM avaliacao_complexidade t
        JOIN nivel_complexidade n ON n.id = t.nivel_complexidade_id
        JOIN utilizador u      ON u.id = t.avaliada_por
        WHERE t.utente_id = %s
        ORDER BY t.avaliada_em DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de avaliações")
    
    return result 

@router.post("/{utente_id}/equipa", response_model=UtenteResumo, status_code=201)
def alterar_equipa_responsavel(utente_id: int, dados: EquipaResponsavelAlterar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    exist = conn.execute("SELECT 1 FROM utente WHERE id = %s", (utente_id,)).fetchone()
    if exist is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    conn.execute(
        """
        UPDATE atribuicao_equipa_responsavel
        SET valido_ate = now()
        WHERE utente_id = %s AND valido_ate IS NULL
        """,
        (utente_id,),
    )


    query = """
            INSERT INTO atribuicao_equipa_responsavel (utente_id, equipa_id, motivo, registada_por)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """

    conn.execute(query, (utente_id, dados.equipa_id, dados.motivo, utilizador["id"],)).fetchone()["id"]

    return obter(utente_id, conn, utilizador)


@router.get("/{utente_id}/historico-equipa")
def historico_equipa(utente_id: int, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    query = """
        SELECT
            a.id,
            a.equipa_id,
            e.codigo       AS equipa_codigo,
            a.valido_desde,
            a.valido_ate,
            a.motivo,
            u.nome         AS registada_por_nome
        FROM atribuicao_equipa_responsavel a
        JOIN equipa e      ON e.id = a.equipa_id
        JOIN utilizador u  ON u.id = a.registada_por
        WHERE a.utente_id = %s
        ORDER BY a.valido_desde DESC
    """

    result = conn.execute(query, (utente_id,)).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="Utente sem histórico de equipa responsável")

    return result


@router.put("/{utente_id}/inativar", response_model=UtenteResumo)
def inativar(utente_id: int, dados: UtenteInativar, conn=Depends(get_conn), utilizador: dict = Depends(get_current_user)):
    utente = conn.execute("SELECT estado FROM utente WHERE id = %s", (utente_id,)).fetchone()
    if utente is None:
        raise HTTPException(status_code=404, detail="Utente não encontrado")

    if utente["estado"] == "INATIVO":
        raise HTTPException(status_code=400, detail="Utente já está inativo")

    data_transicao = dados.data_transicao or date.today()

    conn.execute("UPDATE utente SET estado = 'INATIVO' WHERE id = %s", (utente_id,))

    conn.execute(
        """
        INSERT INTO utente_transicao_estado
            (utente_id, estado_anterior, estado_novo, data_transicao, motivo, registada_por)
        VALUES (%s, %s, 'INATIVO', %s, %s, %s)
        """,
        (utente_id, utente["estado"], data_transicao, dados.motivo, utilizador["id"]),
    )

    return obter(utente_id, conn, utilizador)

