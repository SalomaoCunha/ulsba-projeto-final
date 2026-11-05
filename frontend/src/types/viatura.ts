export type EstadoViatura = 'Ativa' | 'Inativa' | 'Em manutenção';

export interface Viatura {
  id: string;
  matricula: string;
  modelo: string;
  combustivel: string;
  autonomiaKm: number;
  lugares: number;
  estado: EstadoViatura;
  proximaRevisao: string;
  equipaId: string | null; // null = sem equipa atribuída
}