import type { Local } from '../types/local';
import { apiFetch } from './apiClient';

export async function getLocais(): Promise<Local[]> {
  return apiFetch<Local[]>('/locais');
}
