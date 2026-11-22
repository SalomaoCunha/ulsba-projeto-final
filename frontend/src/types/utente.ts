import type { ComplexidadeValor, PrioridadeValor } from "@/config/niveis";

export type TipoLocal = 'Domicílio' | 'Lar' | 'Unidade de Saúde';

// Utente acompanhado pela equipa de cuidados paliativos, já no formato (camelCase)
// usado no frontend — ver utenteService.mapearUtente para a conversão a partir da API.
// "situacaoClinica" é guardada como array de linhas (uma por parágrafo) para facilitar a edição;
// "historicoPrioridade"/"historicoComplexidade" ficam vazios até o backend expor esses endpoints.
export interface Utente {
  id: string | number;
  numeroUtente: string;
  nome: string;
  dataNascimento: string;
  ultimaVisita: string;
  telefone: string;
  equipaResponsavel: string;
  cuidadorPrincipal: string;
  situacaoClinica: string[];
  tipoLocal: TipoLocal;
  nomeInstituicao?: string;
  ruaNumero: string;
  codigoPostal: string;
  localidade: string;
  concelho: string;
  lat: number | null;
  lng: number | null;
  notas: string;
  prioridade: PrioridadeValor;
  historicoPrioridade: AlteracaoPrioridade[];
  complexidade: ComplexidadeValor;
  historicoComplexidade: AlteracaoComplexidade[];
  estado: 'Ativo' | 'Referenciado' | 'Inativo';
}

// Registo de uma mudança de nível de prioridade de um utente (para fins de auditoria/histórico).
export interface AlteracaoPrioridade {
  prioridadeAnterior: PrioridadeValor;
  prioridadeNova: PrioridadeValor;
  motivo: string;
  data: string;
  autor: string;
}

// Registo de uma mudança de nível de complexidade de um utente (para fins de auditoria/histórico).
export interface AlteracaoComplexidade {
  complexidadeAnterior: ComplexidadeValor;
  complexidadeNova: ComplexidadeValor;
  data: string;
  autor: string;
}
