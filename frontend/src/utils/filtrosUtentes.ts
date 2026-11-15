import type { Utente } from '../types/utente';

export interface FiltrosUtentes {
  prioridade: string | null;
  complexidade: string | null;
  estado: string | null;
  equipa: string | null;
  dataDe: string;
  dataAte: string;
}

export const filtrosVazios: FiltrosUtentes = {
  prioridade: null,
  complexidade: null,
  estado: null,
  equipa: null,
  dataDe: '',
  dataAte: '',
};

export function filtrarUtentes(utentes: Utente[], filtros: FiltrosUtentes): Utente[] {
  return utentes.filter((u) => {
    if (filtros.prioridade && u.prioridade !== filtros.prioridade) {
      return false;
    }
    if (filtros.complexidade && u.complexidade !== filtros.complexidade) {
      return false;
    }
    if (filtros.estado && u.estado !== filtros.estado) {
      return false;
    }
    if (filtros.equipa && u.equipaResponsavel !== filtros.equipa) {
      return false;
    }

    const [dia, mes, ano] = u.ultimaVisita.split('-').map(Number);
    const dataVisita = new Date(ano, mes - 1, dia);

    if (filtros.dataDe && dataVisita < new Date(filtros.dataDe)) {
      return false;
    }
    if (filtros.dataAte && dataVisita > new Date(filtros.dataAte)) {
      return false;
    }

    return true;
  });
}
