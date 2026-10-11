export interface Utente {
  id: string | number;
  numeroUtente: string;
  nome: string;
  dataNascimento: string;
  ultimaVisita: string;
  telefone: string;
  medicoAssistente: string;
  cuidadorPrincipal: string;
  situacaoClinica: string[];
  morada: string;
  coordenadas: string;
  notas: string;
  prioridade: 'Urgente 0 dias' | 'Urgente 1 dia' | 'Urgente 2 dias' | 'Não urgente 1' | 'Não urgente 2' | 'Prioritário' | 'Normal';
  estado: 'Ativo' | 'Inativo';
}