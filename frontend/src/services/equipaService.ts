import type { Equipa } from '../types/equipa';
import { apiFetch } from './apiClient';

export async function getEquipas(): Promise<Equipa[]> {
  return apiFetch<Equipa[]>('/equipas');
}
