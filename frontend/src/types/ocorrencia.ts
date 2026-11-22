// Registo de um evento/incidente associado a uma volta ou a uma visita específica
// (ex.: atraso, imprevisto, observação do profissional). "visibilidade" controla quem
// pode ver a ocorrência (ex.: apenas equipa vs. todos).
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
