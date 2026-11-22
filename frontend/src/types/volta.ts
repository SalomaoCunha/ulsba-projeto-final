// Ciclo de vida de uma volta: RASCUNHO (criada, ainda não confirmada) -> CONFIRMADA
// ("Agendada" na UI) -> EM_CURSO -> CONCLUIDA, com CANCELADA possível em qualquer ponto.
// Não é possível saltar etapas (ver comentário em confirmarVolta, no voltaService).
export type EstadoVolta = 'RASCUNHO' | 'CONFIRMADA' | 'EM_CURSO' | 'CONCLUIDA' | 'CANCELADA';
// Ciclo de vida de uma visita individual dentro de uma volta.
export type EstadoVisita = 'PENDENTE' | 'PLANEADA' | 'EM_CURSO' | 'CONCLUIDA' | 'CANCELADA';

// Volta: o trajeto de uma equipa/viatura num dia, visitando um conjunto de utentes.
// Os horários "Previsto" são calculados antecipadamente; os "Real" são preenchidos
// pela equipa no terreno (ver registarHorariosReaisVolta).
export interface Volta {
  id: number;
  data: string;
  designacao: string | null;
  estado: EstadoVolta;
  equipaId: number | null;
  equipaCodigo: string | null;
  viaturaId: number | null;
  viaturaMatricula: string | null;
  partidaPrevista: string | null;
  regressoPrevisto: string | null;
  partidaReal?: string | null;
  regressoReal?: string | null;
}

// Filtros para listar voltas (ver getVoltas); dataInicio/dataFim são obrigatórios.
export interface FiltrosVoltas {
  dataInicio: string; // 'yyyy-MM-dd'
  dataFim: string;
  equipaId?: number;
  viaturaId?: number;
  profissionalId?: number;
  estado?: EstadoVolta;
}

// Linha "plana" da agenda de visitas, juntando dados da visita, da volta e do utente
// numa única estrutura — mais leve que VisitaDetalhe/ParagemDetalhe, usada em listagens.
export interface VisitaAgenda {
  visitaId: number;
  voltaId: number;
  dataVolta: string;
  voltaEstado: EstadoVolta;
  utenteId: number;
  utenteNome: string;
  utenteNumero: string;
  visitaEstado: EstadoVisita;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  inicioReal: string | null;
  fimReal: string | null;
  equipaCodigo: string | null;
  viaturaMatricula: string | null;
  localNome: string | null;
  localMorada: string | null;
}

// Filtros para listar a agenda de visitas (ver getVisitasAgenda).
export interface FiltrosVisitasAgenda {
  dataInicio: string;
  dataFim: string;
  utenteId?: number;
  profissionalId?: number;
  estado?: EstadoVisita;
}

// Dados necessários para criar uma volta: data, equipa/viatura a atribuir e os
// utentes a visitar (o backend calcula a ordem das paragens e os horários estimados).
export interface VoltaCriar {
  data: string;
  equipaId: number;
  viaturaId: number;
  utenteIds: number[];
}

// Visita a um utente dentro de uma paragem do detalhe de uma volta, com horários
// previstos/reais e dados de urgência (usados para destacar visualmente o utente).
export interface VisitaDetalhe {
  visitaId: number;
  utenteId: number;
  utenteNome: string;
  visitaEstado: string;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  duracaoEstimadaMin?: number | null;
  inicioReal: string | null;
  fimReal: string | null;
  duracaoRealMin?: number | null;
  urgenciaDesignacao: string | null;
  urgenciaCor: string | null;
}

// Paragem (local físico) do percurso de uma volta; pode ter mais do que uma visita
// (ex.: dois utentes no mesmo local). "distanciaDesdeAnteriorKm" é a distância desde a paragem anterior.
export interface ParagemDetalhe {
  ordem: number;
  localNome: string | null;
  localMorada: string;
  lat: number | null;
  lng: number | null;
  distanciaDesdeAnteriorKm?: number | null;
  visitas: VisitaDetalhe[];
}

// Resumo calculado de uma volta: durações previstas vs. reais, distância percorrida
// e alertas sobre o cumprimento do horário-limite de regresso à base (Beja).
export interface ResumoVolta {
  duracaoPrevistaVoltaMin: number | null;
  duracaoRealVoltaMin: number | null;
  duracaoPrevistaVisitasMin: number;
  duracaoRealVisitasMin: number | null;
  tempoDeslocacaoPrevistoMin: number | null;
  atrasoSaidaMin: number;
  distanciaParagensSomaKm: number | null;
  horaLimiteRegressoBeja: string;
  comprometeRegressoBeja: boolean;
  excessoRegressoBejaMin: number;
  avisoRegressoBeja: string | null;
  alertasCoerencia: string[];
}

// Detalhe completo de uma volta: inclui as paragens com as respetivas visitas e,
// quando disponível, o resumo calculado (resumo é opcional porque pode não vir da API).
export interface VoltaDetalhe extends Volta {
  distanciaEstimadaKm: number | null;
  distanciaRealKm: number | null;
  paragens: ParagemDetalhe[];
  resumo?: ResumoVolta;
}