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
