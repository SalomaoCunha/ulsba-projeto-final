import type { Utente } from '@/types/utente';

const utentes: Utente[] = [
  {
    id: '1',
    numeroUtente: '12569',
    nome: 'Utente A',
    dataNascimento: '12-03-1942',
    ultimaVisita: '02-07-2026',
    telefone: '912 345 678',
    medicoAssistente: 'Dr. João Martins',
    cuidadorPrincipal: 'Ana Almeida',
    situacaoClinica: ['Hipertensão', 'Diabetes tipo II'],
    morada: 'Rua das Flores, 120',
    coordenadas: '38.69120, -9.31215',
    notas: 'Utente autónoma.',
    prioridade: 'Urgente 0 dias',
    estado: 'Ativo',
  },
  {
    id: '2',
    numeroUtente: '25487',
    nome: 'Utente B',
    dataNascimento: '08-11-1958',
    ultimaVisita: '15-07-2026',
    telefone: '913 456 789',
    medicoAssistente: 'Dr. Carla Santos',
    cuidadorPrincipal: 'Rui Costa',
    situacaoClinica: ['Artrose', 'Mobilidade reduzida'],
    morada: 'Avenida da Liberdade, 45',
    coordenadas: '38.71012, -9.14234',
    notas: 'Necessita de apoio em transporte.',
    prioridade: 'Prioritário',
    estado: 'Ativo',
  },
  {
    id: '3',
    numeroUtente: '34821',
    nome: 'Utente C',
    dataNascimento: '20-01-1974',
    ultimaVisita: '28-07-2026',
    telefone: '914 567 890',
    medicoAssistente: 'Dr. Helena Vieira',
    cuidadorPrincipal: 'Marta Silva',
    situacaoClinica: ['Pressão arterial elevada'],
    morada: 'Travessa do Sol, 8',
    coordenadas: '38.73320, -9.18045',
    notas: 'Segue acompanhamento ambulatorial.',
    prioridade: 'Normal',
    estado: 'Inativo',
  },
];

export async function getUtentesFicticios(): Promise<Utente[]> {
  return new Promise((resolve) => setTimeout(() => resolve(utentes), 300));
}