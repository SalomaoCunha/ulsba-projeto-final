import type { EstadoVolta } from '../types/volta';

export const LABEL_ESTADO_VOLTA: Record<EstadoVolta, string> = {
  RASCUNHO: 'Rascunho',
  CONFIRMADA: 'Agendada',
  EM_CURSO: 'Em execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const COR_ESTADO_VOLTA: Record<EstadoVolta, string> = {
  RASCUNHO: '#adb5bd',
  CONFIRMADA: '#0d6efd',
  EM_CURSO: '#fd7e14',
  CONCLUIDA: '#198754',
  CANCELADA: '#dc3545',
};
