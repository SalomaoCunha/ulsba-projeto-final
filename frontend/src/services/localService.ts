import type { Concelho, Local, NovoLocalPayload } from '../types/local';
import { apiFetch } from './apiClient';

export async function getLocais(): Promise<Local[]> {
  return apiFetch<Local[]>('/locais');
}

export async function getConcelhos(): Promise<Concelho[]> {
  return apiFetch<Concelho[]>('/locais/concelhos');
}

export async function createLocal(dados: NovoLocalPayload): Promise<{ id: number }> {
  return apiFetch<{ id: number }>('/locais', {
    method: 'POST',
    body: JSON.stringify({
      tipo: dados.tipo,
      nome: dados.nome || null,
      morada: dados.morada,
      codigo_postal: dados.codigoPostal || null,
      localidade: dados.localidade,
      concelho_id: dados.concelhoId,
      contacto_telefonico: dados.contactoTelefonico || null,
      lat: dados.lat,
      lng: dados.lng,
    }),
  });
}
