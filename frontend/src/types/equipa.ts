// types/equipa.ts
export interface MembroEquipa {
  id: number;
  nome: string;
  funcao: string; // "Enfermeiro", "Médico", etc.
}

export interface Equipa {
  id: number;
  codigo: string; // "A", "B", …
  designacao: string | null; // "Beja e arredores"
  ativa: boolean;
  membros: MembroEquipa[];
}
