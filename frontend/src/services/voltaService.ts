import type { Volta, FiltrosVoltas, EstadoVolta, VoltaCriar } from '../types/volta';
import { apiFetch } from './apiClient';

interface VoltaDTO {
    id: number;
    data: string;
    designacao: string | null;
    estado: string;
    equipa_id: number | null;
    equipa_codigo: string | null;
    viatura_id: number | null;
    viatura_matricula: string | null;
    partida_prevista: string | null;
    regresso_previsto: string | null;
}

function mapearVolta(dto: VoltaDTO): Volta {
    return {
        id: dto.id,
        data: dto.data,
        designacao: dto.designacao,
        estado: dto.estado as EstadoVolta,
        equipaId: dto.equipa_id,
        equipaCodigo: dto.equipa_codigo,
        viaturaId: dto.viatura_id,
        viaturaMatricula: dto.viatura_matricula,
        partidaPrevista: dto.partida_prevista,
        regressoPrevisto: dto.regresso_previsto,
    }
}

export async function getVoltas(filtros: FiltrosVoltas): Promise<Volta[]> {
    const parametros = new URLSearchParams();
    parametros.set('data_inicio', filtros.dataInicio);
    parametros.set('data_fim', filtros.dataFim);

    if(filtros.equipaId !== undefined) {
        parametros.set('equipa_id', String(filtros.equipaId));
    }

    if(filtros.viaturaId !== undefined) {
        parametros.set('viatura_id', String(filtros.viaturaId));
    }

    if(filtros.estado !== undefined) {
        parametros.set('estado', String(filtros.estado));
    }

    const dtos = await apiFetch<VoltaDTO[]>(`/voltas?${parametros.toString()}`);
    return dtos.map(mapearVolta);
}

export async function criarVolta(dados: VoltaCriar): Promise<{ id: number }> {
  return apiFetch<{ id: number }>('/voltas', {
    method: 'POST',
    body: JSON.stringify({
      data: dados.data,
      equipa_id: dados.equipaId,
      viatura_id: dados.viaturaId,
      utente_ids: dados.utenteIds,
    }),
  });
}
