// Runtime validation coverage for: team CRUD API requests.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './apiClient';
import { createEquipa, getProfissionaisEquipa, updateEquipa } from './equipaService';
import type { DadosEquipa, Equipa } from '../types/equipa';

vi.mock('./apiClient', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);
const dados: DadosEquipa = {
  codigo: 'C',
  designacao: 'Equipa de demonstração',
  membros: [4, 7],
};
const equipa: Equipa = {
  id: 12,
  codigo: 'C',
  designacao: 'Equipa de demonstração',
  ativa: true,
  membros: [],
};

describe('equipaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue(equipa);
  });

  it('creates a team with its member ids', async () => {
    await expect(createEquipa(dados)).resolves.toEqual(equipa);
    expect(apiFetchMock).toHaveBeenCalledWith('/equipas', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  });

  it('updates a team and loads professionals for the member selector', async () => {
    await expect(updateEquipa(12, dados)).resolves.toEqual(equipa);
    expect(apiFetchMock).toHaveBeenCalledWith('/equipas/12', {
      method: 'PUT',
      body: JSON.stringify(dados),
    });

    await getProfissionaisEquipa();
    expect(apiFetchMock).toHaveBeenLastCalledWith('/equipas/profissionais');
  });
});
