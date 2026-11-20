import type { NivelUrgenciaDTO, NivelComplexidadeDTO } from '../types/nivel';
import { apiFetch } from './apiClient';

export async function getNiveisUrgencia(): Promise<NivelUrgenciaDTO[]> {
  return apiFetch<NivelUrgenciaDTO[]>('/niveis/urgencia');
}

export async function getNiveisComplexidade(): Promise<NivelComplexidadeDTO[]> {
  return apiFetch<NivelComplexidadeDTO[]>('/niveis/complexidade');
}
