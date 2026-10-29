// --- Prioridade ---

export type PrioridadeValor = 
  | 'Urgente 0 dias'
  | 'Urgente 1 dia'
  | 'Urgente 2 dias'
  | 'Não urgente 1'
  | 'Não urgente 2';

  export interface NivelPrioridade {
    valor: PrioridadeValor;
    ordem: number;
    label: string;
    icone: string;
    corBg: string;
    corTexto: string;
    corDot: string;
  }

export const NIVEIS_PRIORIDADE: NivelPrioridade[] = [
  {
    valor: 'Urgente 0 dias',
    ordem: 1,
    label: 'Urgente 0 dias',
    icone: 'bi-exclamation-triangle-fill',
    corBg: 'var(--prioridade-1-bg)',
    corTexto: 'var(--prioridade-1-texto)',
    corDot: 'var(--prioridade-1-dot)',
  },
  {
    valor: 'Urgente 1 dia',
    ordem: 2,
    label: 'Urgente 1 dia',
    icone: 'bi-exclamation-triangle-fill',
    corBg: 'var(--prioridade-2-bg)',
    corTexto: 'var(--prioridade-2-texto)',
    corDot: 'var(--prioridade-2-dot)',
  },
  {
    valor: 'Urgente 2 dias',
    ordem: 3,
    label: 'Urgente 2 dias',
    icone: 'bi-exclamation-triangle-fill',
    corBg: 'var(--prioridade-3-bg)',
    corTexto: 'var(--prioridade-3-texto)',
    corDot: 'var(--prioridade-3-dot)',
  },
  {
    valor: 'Não urgente 1',
    ordem: 4,
    label: 'Não urgente 1',
    icone: 'bi-exclamation-triangle-fill',
    corBg: 'var(--prioridade-4-bg)',
    corTexto: 'var(--prioridade-4-texto)',
    corDot: 'var(--prioridade-4-dot)',
  },
  {
    valor: 'Não urgente 2',
    ordem: 5,
    label: 'Não urgente 2',
    icone: 'bi-exclamation-triangle-fill',
    corBg: 'var(--prioridade-5-bg)',
    corTexto: 'var(--prioridade-5-texto)',
    corDot: 'var(--prioridade-5-dot)',
  }
]; 

// --- Complexidade ---
export type ComplexidadeValor = 'Altamente complexo' | 'Complexo' | 'Não complexo';

export interface NivelComplexidade {
    valor: ComplexidadeValor;
    label: string;
    corBg: string;
    corTexto: string;
}

export const NIVEIS_COMPLEXIDADE: NivelComplexidade[] = [
  {
    valor: 'Altamente complexo',
    label: 'Altamente complexo',
    corBg: 'var(--complexidade-alta-bg)',
    corTexto: 'var(--complexidade-alta-texto)',
  },
  {
    valor: 'Complexo',
    label: 'Complexo',
    corBg: 'var(--complexidade-media-bg)',
    corTexto: 'var(--complexidade-media-texto)',
  },
  {
    valor: 'Não complexo',
    label: 'Não complexo',
    corBg: 'var(--complexidade-baixa-bg)',
    corTexto: 'var(--complexidade-baixa-texto)',
  },
]

