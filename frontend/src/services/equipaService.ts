import type { DadosEquipa, Equipa, ProfissionalEquipa } from '../types/equipa';
import { apiFetch } from './apiClient';

export async function getEquipas(): Promise<Equipa[]> {
  return apiFetch<Equipa[]>('/equipas');
}

export async function getProfissionaisEquipa(): Promise<ProfissionalEquipa[]> {
  return apiFetch<ProfissionalEquipa[]>('/equipas/profissionais');
}

export async function createEquipa(dados: DadosEquipa): Promise<Equipa> {
  return apiFetch<Equipa>('/equipas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function updateEquipa(equipaId: number, dados: DadosEquipa): Promise<Equipa> {
  return apiFetch<Equipa>(`/equipas/${equipaId}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}
