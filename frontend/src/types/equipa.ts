// types/equipa.ts
export interface MembroEquipa {
  id: number;
  nome: string;
  funcao: string;
}

export interface Equipa {
  id: number;
  codigo: string; // "A", "B", …
  designacao: string | null;
  ativa: boolean;
  membros: MembroEquipa[];
}

export interface ProfissionalEquipa extends MembroEquipa {
  ativo: boolean;
}

export interface DadosEquipa {
  codigo: string;
  designacao: string | null;
  membros: number[];
}
