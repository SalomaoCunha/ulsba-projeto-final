import type { Concelho, Local, NovoLocalPayload } from '../types/local';
import { apiFetch } from './apiClient';

// Lista todos os locais (domicílios, instituições, etc.) já registados.
export async function getLocais(): Promise<Local[]> {
  return apiFetch<Local[]>('/locais');
}

// Lista os concelhos disponíveis, usados para preencher o campo "concelho" ao criar um local.
export async function getConcelhos(): Promise<Concelho[]> {
  return apiFetch<Concelho[]>('/locais/concelhos');
}

// Cria um novo local. Converte o payload (camelCase, usado no frontend) para o
// formato snake_case que a API espera, tratando campos opcionais em branco como null.
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
