# Schemas Pydantic (corpo dos pedidos/respostas da API) e validações
# partilhadas por vários routers. Cada classe representa a forma dos dados
# trocados num endpoint — não têm lógica de BD, só validação/tipagem.
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
    # Primeiro teste: verifica se, trocando lat com lng, o ponto passaria a
    # cair dentro de Portugal continental. Isto é o erro mais comum ao marcar
    # coordenadas manualmente (lat/lng ao contrário) e merece uma mensagem
    # própria, mais útil do que o erro genérico "fora de Portugal".
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

    # Segundo teste: limites absolutos válidos para qualquer coordenada WGS84
    # (independentemente do país) — protege contra valores sem sentido.
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
        raise HTTPException(
            status_code=400,
            detail="Coordenadas fora dos limites geográficos válidos (latitude entre -90 e 90, longitude entre -180 e 180).",
        )

    # Terceiro teste: o ponto tem de cair dentro da área de Portugal
    # continental — a área de atuação da plataforma (RF04/RNF27).
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


# Corpo usado para atualizar a localização (lat/lng em graus decimais) de um
# utente ou de um local — é validado com validar_coordenadas_portugal.
class CoordenadasAtualizar(BaseModel):
    lat: float
    lng: float


# Resposta da ficha de utente (listagem e detalhe): dados já "achatados" e
# enriquecidos a partir da view vw_utente_ficha (nomes de equipa, urgência,
# complexidade, etc. em vez de apenas os IDs).
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


# Corpo para criar um novo utente — requer local_id (a morada/ponto já tem
# de existir na tabela `local` antes de associar o utente).
class UtenteCriar(BaseModel):
    numero_utente: str
    nome: str
    genero: str
    data_nascimento: date
    local_id: int
    contacto_telefonico: Optional[str] = None
    situacao_clinica: Optional[str] = None
    notas: Optional[str] = None


# Corpo para editar dados de um utente já existente — apenas os campos
# editáveis (numero_utente, genero, data_nascimento e local_id não entram
# aqui, só se alteram por outros fluxos/endpoints dedicados).
class UtenteEditar(BaseModel):
    nome: str
    contacto_telefonico: Optional[str] = None
    situacao_clinica: Optional[str] = None
    notas: Optional[str] = None


# Historico prioridades
# Corpo para registar uma nova avaliação de nível de urgência/prioridade de
# um utente — fica guardado em histórico, nunca substitui o anterior.
class PrioridadeAlterar(BaseModel):
    nivel_urgencia_id: int
    motivo: str   # obrigatório — RF10


# Login
# Credenciais enviadas no POST /auth/login.
class LoginDados(BaseModel):
    email: str
    password: str


# Resposta do login: o JWT a usar nos pedidos seguintes (via Authorization:
# Bearer <token>).
class TokenResposta(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Dados do utilizador autenticado devolvidos por GET /auth/me.
class UtilizadorAtual(BaseModel):
    id: int
    nome: str
    perfil: str
    vista_geral: bool


# Equipas
# Um profissional enquanto membro de uma equipa (nome + função que desempenha
# nessa equipa).
class MembroEquipa(BaseModel):
    id: int
    nome: str
    funcao: str


# Resposta de listagem/detalhe de equipa, já com os membros incluídos.
class EquipaResumo(BaseModel):
    id: int
    codigo: str
    designacao: Optional[str]
    ativa: bool
    membros: list[MembroEquipa]


# Corpo para criar/editar uma equipa: `membros` é a lista de IDs de
# profissionais a associar (a associação em si é substituída por completo).
class EquipaCriarEditar(BaseModel):
    codigo: str = Field(min_length=1, max_length=5)
    designacao: Optional[str] = Field(default=None, max_length=80)
    membros: list[int] = Field(default_factory=list)


# Profissional listado no contexto de uma equipa, incluindo se está ativo.
class ProfissionalEquipaResumo(MembroEquipa):
    ativo: bool


# Função clínica de referência (médico, enfermeiro, …), para preencher o
# seletor ao criar um novo profissional.
class FuncaoProfissionalResumo(BaseModel):
    id: int
    designacao: str


# Corpo para criar um novo profissional de raiz.
class ProfissionalCriar(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    funcao_id: int
    contacto_telefonico: Optional[str] = Field(default=None, max_length=20)


# Viaturas
# Resposta de listagem/detalhe de viatura.
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


# Corpo para criar/editar uma viatura.
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


# Resposta de um período em que uma viatura fica indisponível (manutenção
# ou outra indisponibilidade) — impede que seja atribuída a voltas nesse
# intervalo.
class BloqueioViaturaResumo(BaseModel):
    id: int
    viatura_id: int
    data_inicio: date
    data_fim: date
    tipo: Literal["MANUTENCAO", "INDISPONIBILIDADE"]
    motivo: Optional[str]


# Corpo para criar um bloqueio de viatura.
class BloqueioViaturaCriar(BaseModel):
    data_inicio: date
    data_fim: Optional[date] = None
    tipo: Literal["MANUTENCAO", "INDISPONIBILIDADE"] = "INDISPONIBILIDADE"
    motivo: Optional[str] = None


# Volta
# Resposta de listagem/detalhe de uma volta (percurso de visitas de uma
# equipa, num dia, com uma viatura associada).
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


# Corpo para registar a partida/regresso reais de uma volta (distintos dos
# horários previstos, que são calculados/planeados).
class VoltaHorariosReaisAtualizar(BaseModel):
    partida_real: Optional[datetime] = None
    regresso_real: Optional[datetime] = None


# Corpo para registar o início/fim reais de uma visita (paragem de uma
# volta a um utente).
class VisitaHorariosReaisAtualizar(BaseModel):
    inicio_real: Optional[datetime] = None
    fim_real: Optional[datetime] = None


# Visitas no Calendário (Vista Utente)
# Linha de agenda de um utente: junta dados da visita com os da volta e do
# local, para mostrar tudo num só evento de calendário sem o frontend ter de
# cruzar várias chamadas.
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
# Corpo para criar uma volta: a lista de utente_ids define as visitas a
# gerar, uma por utente, pela ordem indicada.
class VoltaCriar(BaseModel):
    data: date
    equipa_id: int
    viatura_id: int
    utente_ids: list[int]


# complexidadeAlterar
# Corpo para registar uma nova avaliação de complexidade de um utente —
# tal como a prioridade, fica em histórico (nunca substitui a anterior).
class ComplexidadeAlterar(BaseModel):
    nivel_complexidade_id: int
    observacao: Optional[str] = None


# AlterarEquipaResponsavel
# Corpo para reatribuir a equipa responsável por um utente — o registo
# anterior é encerrado (valido_ate) e cria-se um novo, mantendo histórico.
class EquipaResponsavelAlterar(BaseModel):
    equipa_id: int
    motivo: Optional[str] = None


# LocalCriar
# Corpo para criar um local (morada/ponto geográfico) — lat/lng são
# opcionais mas têm de vir os dois ou nenhum (ver validação no router).
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
# Corpo para inativar um utente (ex. alta/óbito) — motivo é obrigatório e
# fica registado em utente_transicao_estado; data_transicao por omissão é
# a data atual.
class UtenteInativar(BaseModel):
    motivo: str
    data_transicao: Optional[date] = None


# Corpo para reativar um utente previamente inativado — mesma lógica que
# UtenteInativar, mas na direção inversa.
class UtenteAtivar(BaseModel):
    motivo: str
    data_transicao: Optional[date] = None


# Corpo para cancelar uma visita.
class VisitaCancelar(BaseModel):
    motivo: str


# ocorrencia
# Corpo para registar uma ocorrência — tem de estar associada a exatamente
# um de volta_id/visita_id (nunca aos dois, nunca a nenhum; ver validação
# no router de ocorrências).
class OcorrenciaCriar(BaseModel):
    volta_id: Optional[int] = None
    visita_id: Optional[int] = None
    tipo_ocorrencia_id: int
    visibilidade: str
    texto: str
    minutos_atraso: Optional[int] = None