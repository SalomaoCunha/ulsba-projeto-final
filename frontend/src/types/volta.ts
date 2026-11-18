export type EstadoVolta = 'RASCUNHO' | 'CONFIRMADA' | 'EM_CURSO' | 'CONCLUIDA' | 'CANCELADA';

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
}

export interface FiltrosVoltas {
  dataInicio: string; // 'yyyy-MM-dd'
  dataFim: string;
  equipaId?: number;
  viaturaId?: number;
  estado?: EstadoVolta;
}

export interface VoltaCriar {
  data: string;
  equipaId: number;
  viaturaId: number;
  utenteIds: number[];
}

export interface VisitaDetalhe {
  visitaId: number;
  utenteId: number;
  utenteNome: string;
  visitaEstado: string;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  inicioReal: string | null;
  fimReal: string | null;
  urgenciaDesignacao: string | null;
  urgenciaCor: string | null;
}

export interface ParagemDetalhe {
  ordem: number;
  localNome: string | null;
  localMorada: string;
  lat: number | null;
  lng: number | null;
  visitas: VisitaDetalhe[];
}

export interface VoltaDetalhe extends Volta {
  distanciaEstimadaKm: number | null;
  distanciaRealKm: number | null;
  paragens: ParagemDetalhe[];
}

