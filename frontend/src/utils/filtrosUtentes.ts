import type { Utente } from '../types/utente';

// Conjunto de filtros aplicáveis à listagem de utentes (todos opcionais/nulos = sem filtro).
export interface FiltrosUtentes {
  prioridade: string | null;
  complexidade: string | null;
  estado: string | null;
  equipa: string | null;
  // Várias localidades selecionáveis em simultâneo (OR entre elas); vazio = todas.
  // "Localidade" é o texto livre da morada (ex.: freguesia/povoação); é
  // diferente de "concelho" (abaixo), que é o concelho administrativo —
  // várias localidades distintas podem pertencer ao mesmo concelho.
  localidades: string[];
  // Vários concelhos selecionáveis em simultâneo (OR entre eles); vazio = todos.
  concelhos: string[];
  dataDe: string;
  dataAte: string;
}

// Estado inicial/"sem filtros" de FiltrosUtentes, usado para repor a listagem completa.
export const filtrosVazios: FiltrosUtentes = {
  prioridade: null,
  complexidade: null,
  estado: null,
  equipa: null,
  localidades: [],
  concelhos: [],
  dataDe: '',
  dataAte: '',
};

// Aplica o conjunto de FiltrosUtentes a uma lista de utentes, devolvendo apenas os
// que cumprem todas as condições ativas (prioridade, complexidade, estado, equipa,
// localidades e intervalo de datas da última visita).
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
    if (filtros.localidades.length > 0 && !filtros.localidades.includes(u.localidade)) {
      return false;
    }
    if (filtros.concelhos.length > 0 && !filtros.concelhos.includes(u.concelho)) {
      return false;
    }

    // ultimaVisita vem do backend em ISO (ex.: "2026-10-02T09:50:00Z"), não
    // em "DD-MM-YYYY" — o Date já sabe interpretar ISO diretamente.
    if (!u.ultimaVisita) {
      return !filtros.dataDe && !filtros.dataAte;
    }

    const dataVisita = new Date(u.ultimaVisita);

    if (filtros.dataDe && dataVisita < new Date(`${filtros.dataDe}T00:00:00.000Z`)) {
      return false;
    }
    // "Até" é inclusivo do próprio dia — comparar com a meia-noite UTC desse
    // dia (como `new Date(filtros.dataAte)` fazia) excluía qualquer visita
    // ocorrida depois das 00:00 UTC nesse dia, ou seja, quase todas.
    if (filtros.dataAte && dataVisita > new Date(`${filtros.dataAte}T23:59:59.999Z`)) {
      return false;
    }

    return true;
  });
}
