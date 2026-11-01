import type { ComplexidadeValor, PrioridadeValor } from "@/config/niveis";

export type TipoLocal = 'Domicílio' | 'Lar' | 'Unidade de Saúde';

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
  lat: number;
  lng: number;
  notas: string;
  prioridade: PrioridadeValor;
  historicoPrioridade: AlteracaoPrioridade[];
  complexidade: ComplexidadeValor;
  historicoComplexidade: AlteracaoComplexidade[];
  estado: 'Ativo' | 'Inativo';
}

export interface AlteracaoPrioridade {
  prioridadeAnterior: PrioridadeValor;
  prioridadeNova: PrioridadeValor;
  motivo: string;
  data: string;
  autor: string;
}

export interface AlteracaoComplexidade {
  complexidadeAnterior: ComplexidadeValor;
  complexidadeNova: ComplexidadeValor;
  data: string;
  autor: string;
}
