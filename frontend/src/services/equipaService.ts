import type {
  DadosEquipa,
  DadosProfissional,
  Equipa,
  FuncaoProfissional,
  ProfissionalEquipa,
} from '../types/equipa';
import { apiFetch } from './apiClient';

// Lista todas as equipas (ativas e, dependendo do backend, também as desativadas).
export async function getEquipas(): Promise<Equipa[]> {
  return apiFetch<Equipa[]>('/equipas');
}

// Lista os profissionais disponíveis para integrar equipas (para seleção em formulários).
export async function getProfissionaisEquipa(): Promise<ProfissionalEquipa[]> {
  return apiFetch<ProfissionalEquipa[]>('/equipas/profissionais');
}

// Lista as funções clínicas de referência (médico, enfermeiro, …), para o
// seletor ao criar um novo profissional.
export async function getFuncoesProfissional(): Promise<FuncaoProfissional[]> {
  return apiFetch<FuncaoProfissional[]>('/equipas/funcoes');
}

// Cria um novo profissional de raiz — até agora só existiam via seed da BD.
export async function createProfissional(dados: DadosProfissional): Promise<ProfissionalEquipa> {
  return apiFetch<ProfissionalEquipa>('/equipas/profissionais', {
    method: 'POST',
    body: JSON.stringify({
      nome: dados.nome,
      funcao_id: dados.funcaoId,
      contacto_telefonico: dados.contactoTelefonico,
    }),
  });
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

// Se a equipa tiver histórico (membros, utentes atribuídos ou voltas), o
// backend desativa-a em vez de apagar fisicamente (devolve "desativada").
export async function deleteEquipa(equipaId: number): Promise<{ apagada: boolean; desativada: boolean }> {
  return apiFetch<{ apagada: boolean; desativada: boolean }>(`/equipas/${equipaId}`, {
    method: 'DELETE',
  });
}
