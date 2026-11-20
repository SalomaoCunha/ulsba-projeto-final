export type EstadoViatura = 'OPERACIONAL' | 'EM_MANUTENCAO' | 'INATIVA';

export interface Viatura {
  id: number;
  matricula: string;
  designacao: string | null;
  tipo_motorizacao: string;
  lugares: number;
  autonomia: number | null;
  unidade_autonomia: string | null;
  estado: EstadoViatura;
  data_ultima_revisao: string | null;
  periodicidade_revisao_meses: number | null;
  equipa_codigo: string | null; // null = sem equipa atribuída
}
