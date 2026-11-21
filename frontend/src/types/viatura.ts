export type EstadoViatura = 'OPERACIONAL' | 'EM_MANUTENCAO' | 'INATIVA';
export type TipoMotorizacao = 'GASOLINA' | 'GASOLEO' | 'HIBRIDO' | 'ELETRICO' | 'OUTRO';
export type UnidadeAutonomia = 'KM' | 'PERCENTAGEM';
export type TipoBloqueioViatura = 'MANUTENCAO' | 'INDISPONIBILIDADE';

export interface Viatura {
  id: number;
  matricula: string;
  designacao: string | null;
  tipo_motorizacao: TipoMotorizacao;
  capacidade_deposito?: string | null;
  autonomia: number | null;
  unidade_autonomia: UnidadeAutonomia | null;
  lugares: number;
  estado: EstadoViatura;
  data_ultima_revisao: string | null;
  periodicidade_revisao_meses: number | null;
  equipa_codigo: string | null;
}

export interface BloqueioViatura {
  id: number;
  viatura_id: number;
  data_inicio: string; // 'yyyy-MM-dd'
  data_fim: string;    // 'yyyy-MM-dd'
  tipo: TipoBloqueioViatura;
  motivo: string | null;
}

export interface NovoBloqueioViatura {
  data_inicio: string;
  data_fim?: string;
  tipo: TipoBloqueioViatura;
  motivo?: string | null;
}

export interface FiltrosBloqueiosViatura {
  viaturaId?: number;
  dataInicio?: string;
  dataFim?: string;
}