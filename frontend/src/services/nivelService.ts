import type { NivelUrgenciaDTO, NivelComplexidadeDTO } from '../types/nivel';
import { apiFetch } from './apiClient';

// Lista os níveis de urgência/prioridade configurados na base de dados (com o respetivo id,
// necessário para chamar alterarPrioridade em utenteService, que exige nivel_urgencia_id).
export async function getNiveisUrgencia(): Promise<NivelUrgenciaDTO[]> {
  return apiFetch<NivelUrgenciaDTO[]>('/niveis/urgencia');
}

// Lista os níveis de complexidade configurados na base de dados (com o respetivo id,
// necessário para chamar alterarComplexidade em utenteService).
export async function getNiveisComplexidade(): Promise<NivelComplexidadeDTO[]> {
  return apiFetch<NivelComplexidadeDTO[]>('/niveis/complexidade');
}
