// types/equipa.ts

// Profissional que integra uma equipa (perspetiva de dentro da equipa).
export interface MembroEquipa {
  id: number;
  nome: string;
  funcao: string;
}

// Equipa de cuidados (ex.: equipa domiciliária), identificada por um código curto.
export interface Equipa {
  id: number;
  codigo: string; // "A", "B", …
  designacao: string | null;
  ativa: boolean;
  membros: MembroEquipa[];
}

// Profissional candidato a integrar uma equipa (perspetiva da lista geral de
// profissionais), com indicação de se está ativo no sistema.
export interface ProfissionalEquipa extends MembroEquipa {
  ativo: boolean;
}

// Dados enviados ao criar/atualizar uma equipa: apenas os ids dos membros
// (não o objeto MembroEquipa completo).
export interface DadosEquipa {
  codigo: string;
  designacao: string | null;
  membros: number[];
}
