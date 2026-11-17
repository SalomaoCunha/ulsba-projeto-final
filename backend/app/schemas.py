from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class UtenteResumo(BaseModel):
    utente_id: int
    numero_utente: str
    nome: str
    idade: int
    estado: str
    genero: str
    data_nascimento: date
    contacto_telefonico: Optional[str]
    urgencia_designacao: Optional[str]
    urgencia_cor: Optional[str]
    complexidade_designacao: Optional[str]
    equipa_responsavel_codigo: Optional[str]
    ultima_visita: Optional[datetime]
    morada: Optional[str]
    codigo_postal: Optional[str]
    localidade: Optional[str]
    concelho: Optional[str]
    cuidador_principal_nome: Optional[str]
    lat: Optional[float]
    lng: Optional[float]

class UtenteCriar(BaseModel):
    numero_utente: str
    nome: str
    genero: str
    data_nascimento: date
    local_id: int
    contacto_telefonico: Optional[str] = None
    situacao_clinica: Optional[str] = None
    notas: Optional[str] = None

class UtenteEditar(BaseModel):
    nome: str
    contacto_telefonico: Optional[str] = None
    situacao_clinica: Optional[str] = None
    notas: Optional[str] = None

# Historico prioridades
class PrioridadeAlterar(BaseModel):
    nivel_urgencia_id: int
    motivo: str   # obrigatório — RF10

#Login
class LoginDados(BaseModel):
    email: str
    password: str

class TokenResposta(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UtilizadorAtual(BaseModel):
    id: int
    nome: str
    perfil: str
    vista_geral: bool

#Equipas
class MembroEquipa(BaseModel):
    id: int
    nome: str
    funcao: str

class EquipaResumo(BaseModel):
    id: int
    codigo: str
    designacao: Optional[str]
    ativa: bool
    membros: list[MembroEquipa]

#Viaturas
class ViaturaResumo(BaseModel):
    id: int
    matricula: str
    designacao: Optional[str]
    tipo_motorizacao: str
    lugares: int
    autonomia: Optional[float]
    unidade_autonomia: Optional[str]
    estado: str
    data_ultima_revisao: Optional[date]
    periodicidade_revisao_meses: Optional[int]
    equipa_codigo: Optional[str]

#Volta
class VoltaResumo(BaseModel):
    id: int
    data: date
    designacao: Optional[str]
    estado: str
    equipa_id: Optional[int]
    equipa_codigo: Optional[str]
    viatura_id: Optional[int]
    viatura_matricula: Optional[str]
    partida_prevista: Optional[datetime]
    regresso_previsto: Optional[datetime]





