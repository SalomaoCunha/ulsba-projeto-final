import { apiFetch } from './apiClient';

export interface UtilizadorAtual {
  id: number;
  nome: string;
  perfil: string;
  vista_geral: boolean;
}

export async function getUtilizadorAtual(): Promise<UtilizadorAtual> {
  return apiFetch<UtilizadorAtual>('/auth/me');
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
