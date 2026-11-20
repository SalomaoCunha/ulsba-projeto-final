export interface Ocorrencia {
  id: number;
  voltaId: number | null;
  visitaId: number | null;
  tipoCodigo: string;
  tipoDesignacao: string;
  visibilidade: string;
  texto: string;
  minutosAtraso: number | null;
  criadaEm: string;
  autorNome: string;
}
