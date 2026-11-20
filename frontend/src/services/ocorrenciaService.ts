import type { Ocorrencia } from '../types/ocorrencia';
import { apiFetch } from './apiClient';

interface OcorrenciaDTO {
  id: number;
  volta_id: number | null;
  visita_id: number | null;
  tipo_codigo: string;
  tipo_designacao: string;
  visibilidade: string;
  texto: string;
  minutos_atraso: number | null;
  criada_em: string;
  autor_nome: string;
}

function mapearOcorrencia(dto: OcorrenciaDTO): Ocorrencia {
  return {
    id: dto.id,
    voltaId: dto.volta_id,
    visitaId: dto.visita_id,
    tipoCodigo: dto.tipo_codigo,
    tipoDesignacao: dto.tipo_designacao,
    visibilidade: dto.visibilidade,
    texto: dto.texto,
    minutosAtraso: dto.minutos_atraso,
    criadaEm: dto.criada_em,
    autorNome: dto.autor_nome,
  };
}

export async function getOcorrencias(filtro: { voltaId?: number; visitaId?: number }): Promise<Ocorrencia[]> {
  const parametros = new URLSearchParams();
  if (filtro.voltaId !== undefined) parametros.set('volta_id', String(filtro.voltaId));
  if (filtro.visitaId !== undefined) parametros.set('visita_id', String(filtro.visitaId));

  const dtos = await apiFetch<OcorrenciaDTO[]>(`/ocorrencias?${parametros.toString()}`);
  return dtos.map(mapearOcorrencia);
}
