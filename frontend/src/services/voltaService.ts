import type {
  Volta,
  FiltrosVoltas,
  EstadoVolta,
  EstadoVisita,
  VoltaCriar,
  VoltaDetalhe,
  VisitaAgenda,
  FiltrosVisitasAgenda,
  ResumoVolta,
} from '../types/volta';
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
  partida_real?: string | null;
  regresso_real?: string | null;
}

interface VisitaAgendaDTO {
  visita_id: number;
  volta_id: number;
  data_volta: string;
  volta_estado: string;
  utente_id: number;
  utente_nome: string;
  utente_numero: string;
  visita_estado: string;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  inicio_real: string | null;
  fim_real: string | null;
  equipa_codigo: string | null;
  viatura_matricula: string | null;
  local_nome: string | null;
  local_morada: string | null;
}

interface ResumoVoltaDTO {
  duracao_prevista_volta_min: number | null;
  duracao_real_volta_min: number | null;
  duracao_prevista_visitas_min: number;
  duracao_real_visitas_min: number | null;
  tempo_deslocacao_previsto_min: number | null;
  atraso_saida_min: number;
  distancia_paragens_soma_km: number | null;
  hora_limite_regresso_beja: string;
  compromete_regresso_beja: boolean;
  excesso_regresso_beja_min: number;
  aviso_regresso_beja: string | null;
  alertas_coerencia: string[];
}

interface VisitaDetalheDTO {
  visita_id: number;
  utente_id: number;
  utente_nome: string;
  visita_estado: string;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  duracao_estimada_min?: number | null;
  inicio_real: string | null;
  fim_real: string | null;
  duracao_real_min?: number | null;
  urgencia_designacao: string | null;
  urgencia_cor: string | null;
}

interface ParagemDetalheDTO {
  ordem: number;
  local_nome: string | null;
  local_morada: string;
  lat: number | null;
  lng: number | null;
  distancia_desde_anterior_km?: number | null;
  visitas: VisitaDetalheDTO[];
}

interface VoltaDetalheDTO extends VoltaDTO {
  distancia_estimada_km: number | null;
  distancia_real_km: number | null;
  paragens: ParagemDetalheDTO[];
  resumo?: ResumoVoltaDTO;
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
    partidaReal: dto.partida_real ?? null,
    regressoReal: dto.regresso_real ?? null,
  };
}

function mapearResumo(dto?: ResumoVoltaDTO): ResumoVolta | undefined {
  if (!dto) return undefined;
  return {
    duracaoPrevistaVoltaMin: dto.duracao_prevista_volta_min,
    duracaoRealVoltaMin: dto.duracao_real_volta_min,
    duracaoPrevistaVisitasMin: dto.duracao_prevista_visitas_min,
    duracaoRealVisitasMin: dto.duracao_real_visitas_min,
    tempoDeslocacaoPrevistoMin: dto.tempo_deslocacao_previsto_min,
    atrasoSaidaMin: dto.atraso_saida_min,
    distanciaParagensSomaKm: dto.distancia_paragens_soma_km,
    horaLimiteRegressoBeja: dto.hora_limite_regresso_beja,
    comprometeRegressoBeja: dto.compromete_regresso_beja,
    excessoRegressoBejaMin: dto.excesso_regresso_beja_min,
    avisoRegressoBeja: dto.aviso_regresso_beja,
    alertasCoerencia: dto.alertas_coerencia ?? [],
  };
}

function mapearVoltaDetalhe(dto: VoltaDetalheDTO): VoltaDetalhe {
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
      distanciaDesdeAnteriorKm: p.distancia_desde_anterior_km ?? null,
      visitas: p.visitas.map((v) => ({
        visitaId: v.visita_id,
        utenteId: v.utente_id,
        utenteNome: v.utente_nome,
        visitaEstado: v.visita_estado,
        inicioPrevisto: v.inicio_previsto,
        fimPrevisto: v.fim_previsto,
        duracaoEstimadaMin: v.duracao_estimada_min ?? null,
        inicioReal: v.inicio_real,
        fimReal: v.fim_real,
        duracaoRealMin: v.duracao_real_min ?? null,
        urgenciaDesignacao: v.urgencia_designacao,
        urgenciaCor: v.urgencia_cor,
      })),
    })),
    resumo: mapearResumo(dto.resumo),
  };
}

function mapearVisitaAgenda(dto: VisitaAgendaDTO): VisitaAgenda {
  return {
    visitaId: dto.visita_id,
    voltaId: dto.volta_id,
    dataVolta: dto.data_volta,
    voltaEstado: dto.volta_estado as EstadoVolta,
    utenteId: dto.utente_id,
    utenteNome: dto.utente_nome,
    utenteNumero: dto.utente_numero,
    visitaEstado: dto.visita_estado as EstadoVisita,
    inicioPrevisto: dto.inicio_previsto,
    fimPrevisto: dto.fim_previsto,
    inicioReal: dto.inicio_real,
    fimReal: dto.fim_real,
    equipaCodigo: dto.equipa_codigo,
    viaturaMatricula: dto.viatura_matricula,
    localNome: dto.local_nome,
    localMorada: dto.local_morada,
  };
}

export async function getVoltas(filtros: FiltrosVoltas): Promise<Volta[]> {
  const parametros = new URLSearchParams();
  parametros.set('data_inicio', filtros.dataInicio);
  parametros.set('data_fim', filtros.dataFim);

  if (filtros.equipaId !== undefined) {
    parametros.set('equipa_id', String(filtros.equipaId));
  }

  if (filtros.viaturaId !== undefined) {
    parametros.set('viatura_id', String(filtros.viaturaId));
  }

  if (filtros.profissionalId !== undefined) {
    parametros.set('profissional_id', String(filtros.profissionalId));
  }

  if (filtros.estado !== undefined) {
    parametros.set('estado', String(filtros.estado));
  }

  const dtos = await apiFetch<VoltaDTO[]>(`/voltas?${parametros.toString()}`);
  return dtos.map(mapearVolta);
}

export async function getVisitasAgenda(filtros: FiltrosVisitasAgenda): Promise<VisitaAgenda[]> {
  const parametros = new URLSearchParams();
  parametros.set('data_inicio', filtros.dataInicio);
  parametros.set('data_fim', filtros.dataFim);

  if (filtros.utenteId !== undefined) {
    parametros.set('utente_id', String(filtros.utenteId));
  }

  if (filtros.profissionalId !== undefined) {
    parametros.set('profissional_id', String(filtros.profissionalId));
  }

  if (filtros.estado !== undefined) {
    parametros.set('estado', String(filtros.estado));
  }

  const dtos = await apiFetch<VisitaAgendaDTO[]>(`/voltas/visitas?${parametros.toString()}`);
  return dtos.map(mapearVisitaAgenda);
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

export async function getVoltaDetalhe(id: number): Promise<VoltaDetalhe> {
  const dto = await apiFetch<VoltaDetalheDTO>(`/voltas/${id}`);
  return mapearVoltaDetalhe(dto);
}

export async function registarHorariosReaisVolta(
  voltaId: number,
  dados: { partidaReal?: string | null; regressoReal?: string | null },
): Promise<VoltaDetalhe> {
  const dto = await apiFetch<VoltaDetalheDTO>(`/voltas/${voltaId}/horarios-reais`, {
    method: 'PUT',
    body: JSON.stringify({
      partida_real: dados.partidaReal ?? null,
      regresso_real: dados.regressoReal ?? null,
    }),
  });
  return mapearVoltaDetalhe(dto);
}

export async function registarHorariosReaisVisita(
  voltaId: number,
  visitaId: number,
  dados: { inicioReal?: string | null; fimReal?: string | null },
): Promise<VoltaDetalhe> {
  const dto = await apiFetch<VoltaDetalheDTO>(
    `/voltas/${voltaId}/visitas/${visitaId}/horarios-reais`,
    {
      method: 'PUT',
      body: JSON.stringify({
        inicio_real: dados.inicioReal ?? null,
        fim_real: dados.fimReal ?? null,
      }),
    },
  );
  return mapearVoltaDetalhe(dto);
}