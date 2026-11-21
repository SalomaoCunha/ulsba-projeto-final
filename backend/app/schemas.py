from datetime import date, datetime
from typing import Literal, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field

# Limites aproximados de Portugal continental (WGS84 / SRID 4326)
PT_CONT_LAT_MIN = 36.95
PT_CONT_LAT_MAX = 42.16
PT_CONT_LNG_MIN = -9.55
PT_CONT_LNG_MAX = -6.18


def validar_coordenadas_portugal(lat: float, lng: float) -> None:
    """Valida se o ponto cai em Portugal continental e deteta lat/lng trocadas (RF04/RNF27)."""
    if (
        PT_CONT_LAT_MIN <= lng <= PT_CONT_LAT_MAX
        and PT_CONT_LNG_MIN <= lat <= PT_CONT_LNG_MAX
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Coordenadas inválidas: a latitude e a longitude parecem estar trocadas. "
                "Em Portugal continental a latitude situa-se entre 36.95 e 42.16 e a longitude entre -9.55 e -6.18."
            ),
        )

    if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
        raise HTTPException(
            status_code=400,
            detail="Coordenadas fora dos limites geográficos válidos (latitude entre -90 e 90, longitude entre -180 e 180).",
        )

    if not (
        PT_CONT_LAT_MIN <= lat <= PT_CONT_LAT_MAX
        and PT_CONT_LNG_MIN <= lng <= PT_CONT_LNG_MAX
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Coordenadas fora de Portugal continental. "
                "A latitude deve estar entre 36.95 e 42.16 e a longitude entre -9.55 e -6.18."
            ),
        )


class CoordenadasAtualizar(BaseModel):
    lat: float
    lng: float


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
    situacao_clinica: Optional[str] = None
    notas: Optional[str] = None
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


# Login
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


# Equipas
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


class EquipaCriarEditar(BaseModel):
    codigo: str = Field(min_length=1, max_length=5)
    designacao: Optional[str] = Field(default=None, max_length=80)
    membros: list[int] = Field(default_factory=list)


class ProfissionalEquipaResumo(MembroEquipa):
    ativo: bool


# Viaturas
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


class ViaturaCriarEditar(BaseModel):
    matricula: str
    designacao: Optional[str] = None
    tipo_motorizacao: str
    lugares: int
    autonomia: Optional[float] = None
    unidade_autonomia: Optional[str] = "KM"
    estado: str = "OPERACIONAL"
    data_ultima_revisao: Optional[date] = None
    periodicidade_revisao_meses: Optional[int] = None
    equipa_codigo: Optional[str] = None


class BloqueioViaturaResumo(BaseModel):
    id: int
    viatura_id: int
    data_inicio: date
    data_fim: date
    tipo: Literal["MANUTENCAO", "INDISPONIBILIDADE"]
    motivo: Optional[str]


class BloqueioViaturaCriar(BaseModel):
    data_inicio: date
    data_fim: Optional[date] = None
    tipo: Literal["MANUTENCAO", "INDISPONIBILIDADE"] = "INDISPONIBILIDADE"
    motivo: Optional[str] = None


# Volta
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


class VoltaHorariosReaisAtualizar(BaseModel):
    partida_real: Optional[datetime] = None
    regresso_real: Optional[datetime] = None


class VisitaHorariosReaisAtualizar(BaseModel):
    inicio_real: Optional[datetime] = None
    fim_real: Optional[datetime] = None


# Visitas no Calendário (Vista Utente)
class VisitaAgendaResumo(BaseModel):
    visita_id: int
    volta_id: int
    data_volta: date
    volta_estado: str
    utente_id: int
    utente_nome: str
    utente_numero: str
    visita_estado: str
    inicio_previsto: Optional[datetime]
    fim_previsto: Optional[datetime]
    inicio_real: Optional[datetime]
    fim_real: Optional[datetime]
    equipa_codigo: Optional[str]
    viatura_matricula: Optional[str]
    local_nome: Optional[str]
    local_morada: Optional[str]


# VoltaCriar
class VoltaCriar(BaseModel):
    data: date
    equipa_id: int
    viatura_id: int
    utente_ids: list[int]


# complexidadeAlterar
class ComplexidadeAlterar(BaseModel):
    nivel_complexidade_id: int
    observacao: Optional[str] = None


# AlterarEquipaResponsavel
class EquipaResponsavelAlterar(BaseModel):
    equipa_id: int
    motivo: Optional[str] = None


# LocalCriar
class LocalCriar(BaseModel):
    tipo: str
    nome: Optional[str] = None
    morada: str
    codigo_postal: Optional[str] = None
    localidade: str
    concelho_id: int
    contacto_telefonico: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


# UtenteInativar
class UtenteInativar(BaseModel):
    motivo: str
    data_transicao: Optional[date] = None


# ocorrencia
class OcorrenciaCriar(BaseModel):
    volta_id: Optional[int] = None
    visita_id: Optional[int] = None
    tipo_ocorrencia_id: int
    visibilidade: str
    texto: str
    minutos_atraso: Optional[int] = None