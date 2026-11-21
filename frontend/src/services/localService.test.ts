// Runtime validation coverage for: local creation API payload.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './apiClient';
import { createLocal } from './localService';
import type { NovoLocalPayload } from '../types/local';

vi.mock('./apiClient', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

describe('createLocal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue({ id: 42 });
  });

  it('posts the selected address, concelho and confirmed coordinates', async () => {
    const dados: NovoLocalPayload = {
      tipo: 'DOMICILIO',
      morada: 'Rua de exemplo, 1',
      codigoPostal: '7800-000',
      localidade: 'Beja',
      concelhoId: 3,
      contactoTelefonico: '284 000 000',
      lat: 38.016,
      lng: -7.872,
    };

    await expect(createLocal(dados)).resolves.toEqual({ id: 42 });
    expect(apiFetchMock).toHaveBeenCalledWith('/locais', {
      method: 'POST',
      body: JSON.stringify({
        tipo: 'DOMICILIO',
        nome: null,
        morada: 'Rua de exemplo, 1',
        codigo_postal: '7800-000',
        localidade: 'Beja',
        concelho_id: 3,
        contacto_telefonico: '284 000 000',
        lat: 38.016,
        lng: -7.872,
      }),
    });
  });
});
