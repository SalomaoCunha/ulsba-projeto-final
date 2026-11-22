export type EstadoViatura = 'OPERACIONAL' | 'EM_MANUTENCAO' | 'INATIVA';
export type TipoMotorizacao = 'GASOLINA' | 'GASOLEO' | 'HIBRIDO' | 'ELETRICO' | 'OUTRO';
// Unidade em que a autonomia da viatura é expressa: quilómetros (veículos a combustão/híbridos)
// ou percentagem de carga (veículos elétricos).
export type UnidadeAutonomia = 'KM' | 'PERCENTAGEM';
export type TipoBloqueioViatura = 'MANUTENCAO' | 'INDISPONIBILIDADE';

// Viatura da frota usada para realizar as voltas. Nota: os campos mantêm-se em
// snake_case (ao contrário de outros tipos do frontend) porque este tipo é usado
// diretamente como payload dos pedidos à API em viaturaService.
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

// Período em que uma viatura está indisponível (ex.: manutenção), usado para
// impedir que seja escolhida numa volta nesse intervalo (ver viaturaBloqueadaNoDia).
export interface BloqueioViatura {
  id: number;
  viatura_id: number;
  data_inicio: string; // 'yyyy-MM-dd'
  data_fim: string;    // 'yyyy-MM-dd'
  tipo: TipoBloqueioViatura;
  motivo: string | null;
}

// Dados para criar um bloqueio; data_fim é opcional porque, se omitida, assume-se
// igual a data_inicio (bloqueio de um só dia) — ver criarBloqueioViatura.
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