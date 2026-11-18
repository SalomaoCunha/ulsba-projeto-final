import type { Volta, FiltrosVoltas, EstadoVolta, VoltaCriar, VoltaDetalhe } from '../types/volta';
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

interface VisitaDetalheDTO {
  visita_id: number;
  utente_id: number;
  utente_nome: string;
  visita_estado: string;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  inicio_real: string | null;
  fim_real: string | null;
  urgencia_designacao: string | null;
  urgencia_cor: string | null;
}

interface ParagemDetalheDTO {
  ordem: number;
  local_nome: string | null;
  local_morada: string;
  lat: number | null;
  lng: number | null;
  visitas: VisitaDetalheDTO[];
}

interface VoltaDetalheDTO extends VoltaDTO {
  distancia_estimada_km: number | null;
  distancia_real_km: number | null;
  paragens: ParagemDetalheDTO[];
}

export async function getVoltaDetalhe(id: number): Promise<VoltaDetalhe> {
  const dto = await apiFetch<VoltaDetalheDTO>(`/voltas/${id}`);
  return {
    ...mapearVolta(dto),
    distanciaEstimadaKm: dto.distancia_estimada_km,
    distanciaRealKm: dto.distancia_real_km,
    paragens: dto.paragens.map((p) => ({
      ordem: p.ordem,
      localNome: p.local_nome,
      localMorada: p.local_morada,
      lat: p.lat,
      lng: p.lng,
      visitas: p.visitas.map((v) => ({
        visitaId: v.visita_id,
        utenteId: v.utente_id,
        utenteNome: v.utente_nome,
        visitaEstado: v.visita_estado,
        inicioPrevisto: v.inicio_previsto,
        fimPrevisto: v.fim_previsto,
        inicioReal: v.inicio_real,
        fimReal: v.fim_real,
        urgenciaDesignacao: v.urgencia_designacao,
        urgenciaCor: v.urgencia_cor,
      })),
    })),
  };
}

