import type { Viatura } from '../types/viatura';
import { apiFetch } from './apiClient';

export async function getViaturas(): Promise<Viatura[]> {
  return apiFetch<Viatura[]>('/viaturas');
}
