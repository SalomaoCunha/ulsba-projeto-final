import type { ComplexidadeValor, PrioridadeValor } from "@/config/niveis";

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
  morada: string;
  lat: number;
  lng: number;
  notas: string;
  prioridade: PrioridadeValor;
  historicoPrioridade: AlteracaoPrioridade[];
  complexidade: ComplexidadeValor;
  estado: 'Ativo' | 'Inativo';
}

export interface AlteracaoPrioridade {
  prioridadeAnterior: PrioridadeValor;
  prioridadeNova: PrioridadeValor;
  data: string;
  autor: string;  
}