export type EstadoViatura = 'OPERACIONAL' | 'EM_MANUTENCAO' | 'INATIVA';
export type TipoMotorizacao = 'GASOLINA' | 'GASOLEO' | 'HIBRIDO' | 'ELETRICO' | 'OUTRO';
export type UnidadeAutonomia = 'KM' | 'PERCENTAGEM';

export interface Viatura {
  id: number;
  matricula: string;
  designacao: string | null;
  tipo_motorizacao: TipoMotorizacao;
  autonomia: number | null;
  unidade_autonomia: UnidadeAutonomia | null;
  lugares: number;
  estado: EstadoViatura;
  data_ultima_revisao: string | null;
  periodicidade_revisao_meses: number | null;
  equipa_codigo: string | null;
}