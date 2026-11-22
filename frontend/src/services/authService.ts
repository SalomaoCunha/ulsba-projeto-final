import { apiFetch } from './apiClient';

// Dados do profissional autenticado, devolvidos pelo endpoint /auth/me.
// "vista_geral" indica se o utilizador pode ver dados de todas as equipas (não só a sua).
export interface UtilizadorAtual {
  id: number;
  nome: string;
  perfil: string;
  vista_geral: boolean;
}

// Obtém o utilizador autenticado atual, com base no token guardado em localStorage.
export async function getUtilizadorAtual(): Promise<UtilizadorAtual> {
  return apiFetch<UtilizadorAtual>('/auth/me');
}

// Termina a sessão: remove o token local e redireciona para a página de login.
export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
