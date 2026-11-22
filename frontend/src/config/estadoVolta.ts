import type { EstadoVolta } from '../types/volta';

// Texto a mostrar na interface para cada estado de uma volta.
// Nota: o estado interno "CONFIRMADA" é apresentado ao utilizador como "Agendada".
export const LABEL_ESTADO_VOLTA: Record<EstadoVolta, string> = {
  RASCUNHO: 'Rascunho',
  CONFIRMADA: 'Agendada',
  EM_CURSO: 'Em execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

// Cor associada a cada estado de volta, usada em badges/indicadores visuais.
export const COR_ESTADO_VOLTA: Record<EstadoVolta, string> = {
  RASCUNHO: '#adb5bd',
  CONFIRMADA: '#0d6efd',
  EM_CURSO: '#fd7e14',
  CONCLUIDA: '#198754',
  CANCELADA: '#dc3545',
};
