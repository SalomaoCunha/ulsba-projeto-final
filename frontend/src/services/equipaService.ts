import type { Equipa } from '../types/equipa';

const equipas: Equipa[] = [
  {
    id: 'equipa-a',
    nome: 'Equipa A',
    zona: 'Beja e arredores',
    profissionais: [
      { nome: 'Enf. Ana Silva', funcao: 'Enfermeira' },
      { nome: 'Dr. João Martins', funcao: 'Médico' },
    ],
  },
  {
    id: 'equipa-b',
    nome: 'Equipa B',
    zona: 'Cuba, Serpa e Vidigueira',
    profissionais: [
      { nome: 'Enf. Marta Lopes', funcao: 'Enfermeira' },
      { nome: 'Dra. Sofia Lima', funcao: 'Médica' },
    ],
  },
];

export async function getEquipasFicticias(): Promise<Equipa[]> {
  return new Promise((resolve) => setTimeout(() => resolve(equipas), 300));
}
