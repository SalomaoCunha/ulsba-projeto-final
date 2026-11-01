import type { Viatura } from '../types/viatura';

const viaturas: Viatura[] = [
  {
    id: 'viatura-aa24bb',
    matricula: 'AA-24-BB',
    modelo: 'Renault Kangoo',
    combustivel: 'Gasóleo',
    autonomiaKm: 640,
    lugares: 5,
    estado: 'Ativa',
    proximaRevisao: '2027-03-15',
    equipaId: 'equipa-a',
  },
  {
    id: 'viatura-cc18dd',
    matricula: 'CC-18-DD',
    modelo: 'Peugeot e-Rifter',
    combustivel: 'Elétrico',
    autonomiaKm: 245,
    lugares: 5,
    estado: 'Ativa',
    proximaRevisao: '2027-01-20',
    equipaId: 'equipa-b',
  },
  {
    id: 'viatura-ee42ff',
    matricula: 'EE-42-FF',
    modelo: 'Dacia Jogger',
    combustivel: 'Gasolina',
    autonomiaKm: 520,
    lugares: 7,
    estado: 'Em manutenção',
    proximaRevisao: '2026-12-01',
    equipaId: null,
  },
];

export async function getViaturasFicticias(): Promise<Viatura[]> {
  return new Promise((resolve) => setTimeout(() => resolve(viaturas), 300));
}
