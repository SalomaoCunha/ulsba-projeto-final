import type { Utente } from '../types/utente';
import { apiFetch } from './apiClient';

export async function getUtentes(): Promise<Utente[]> {
  return apiFetch<Utente[]>('/utentes');
}

export async function getUtenteById(id: string): Promise<Utente> {
  return apiFetch<Utente>(`/utentes/${id}`);
}

export async function createUtente(novoUtente: Omit<Utente, 'id'>): Promise<Utente> {
  return apiFetch<Utente>('/utentes', {
    method: 'POST',
    body: JSON.stringify(novoUtente),
  });
}

export async function updateUtente(utenteAtualizado: Utente): Promise<Utente> {
  return apiFetch<Utente>(`/utentes/${utenteAtualizado.id}`, {
    method: 'PUT',
    body: JSON.stringify(utenteAtualizado),
  });
}