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



