import type { Viatura } from '../types/viatura';
import { apiFetch } from './apiClient';

export async function getViaturas(): Promise<Viatura[]> {
  return apiFetch<Viatura[]>('/viaturas');
}

export async function createViatura(novaViatura: Omit<Viatura, 'id'>): Promise<Viatura> {
  return apiFetch<Viatura>('/viaturas', {
    method: 'POST',
    body: JSON.stringify(novaViatura),
  });
}

export async function updateViatura(viaturaAtualizada: Viatura): Promise<Viatura> {
  return apiFetch<Viatura>(`/viaturas/${viaturaAtualizada.id}`, {
    method: 'PUT',
    body: JSON.stringify(viaturaAtualizada),
  });
}