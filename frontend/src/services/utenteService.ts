import type { Utente } from '../types/utente';
import { apiFetch } from './apiClient';

// Forma real da resposta da API (snake_case, só os campos não-clínicos —
// situação clínica e notas ficam de fora por omissão, RNF22).
interface UtenteDTO {
  utente_id: number;
  numero_utente: string;
  nome: string;
  estado: string;
  data_nascimento: string;
  ultima_visita: string | null;
  contacto_telefonico: string | null;
  equipa_responsavel_codigo: string | null;
  urgencia_designacao: string | null;
  complexidade_designacao: string | null;
  morada: string | null;
  codigo_postal: string | null;
  localidade: string | null;
  concelho: string | null;
  cuidador_principal_nome: string | null;
  lat: number | null;
  lng: number | null;
}

// A API ainda não devolve situação clínica, notas nem histórico no resumo —
// ficam com valores vazios/seguros até existirem esses endpoints/campos.
function mapearUtente(dto: UtenteDTO): Utente {
  return {
    id: dto.utente_id,
    numeroUtente: dto.numero_utente,
    nome: dto.nome,
    dataNascimento: dto.data_nascimento,
    ultimaVisita: dto.ultima_visita ?? '',
    telefone: dto.contacto_telefonico ?? '',
    equipaResponsavel: dto.equipa_responsavel_codigo ? `Equipa ${dto.equipa_responsavel_codigo}` : '',
    cuidadorPrincipal: dto.cuidador_principal_nome ?? '',
    situacaoClinica: [],
    tipoLocal: 'Domicílio',
    ruaNumero: dto.morada ?? '',
    codigoPostal: dto.codigo_postal ?? '',
    localidade: dto.localidade ?? '',
    concelho: dto.concelho ?? '',
    lat: dto.lat ?? 0,
    lng: dto.lng ?? 0,
    notas: '',
    prioridade: (dto.urgencia_designacao ?? '') as Utente['prioridade'],
    historicoPrioridade: [],
    complexidade: (dto.complexidade_designacao ?? '') as Utente['complexidade'],
    historicoComplexidade: [],
    estado: dto.estado === 'ATIVO' ? 'Ativo' : 'Inativo',
  };
}

export async function getUtentes(): Promise<Utente[]> {
  const dtos = await apiFetch<UtenteDTO[]>('/utentes');
  return dtos.map(mapearUtente);
}

export async function getUtenteById(id: string): Promise<Utente> {
  const dto = await apiFetch<UtenteDTO>(`/utentes/${id}`);
  return mapearUtente(dto);
}

// O que o formulário "Novo Utente" recolhe — não é um Utente (esse só existe
// depois de a BD gerar o id e os dados derivados como idade/última visita).
export interface NovoUtentePayload {
  numeroUtente: string;
  nome: string;
  genero: string;
  dataNascimento: string;
  localId: number;
  contactoTelefonico?: string;
  situacaoClinica?: string;
  notas?: string;
}

export async function createUtente(dados: NovoUtentePayload): Promise<Utente> {
  const dto = await apiFetch<UtenteDTO>('/utentes', {
    method: 'POST',
    body: JSON.stringify({
      numero_utente: dados.numeroUtente,
      nome: dados.nome,
      genero: dados.genero,
      data_nascimento: dados.dataNascimento,
      local_id: dados.localId,
      contacto_telefonico: dados.contactoTelefonico || null,
      situacao_clinica: dados.situacaoClinica || null,
      notas: dados.notas || null,
    }),
  });
  return mapearUtente(dto);
}

// Só os campos que o PUT /utentes/{id} aceita de facto (UtenteEditar no
// backend). Antes disto enviava o Utente inteiro com chaves erradas
// (telefone/situacaoClinica em vez de contacto_telefonico/situacao_clinica)
// — o backend recebia "null" nesses campos e APAGAVA os dados existentes
// a cada edição, mesmo sem o utilizador ter mexido neles.
export async function updateUtente(utenteAtualizado: Utente): Promise<Utente> {
  const dto = await apiFetch<UtenteDTO>(`/utentes/${utenteAtualizado.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nome: utenteAtualizado.nome,
      contacto_telefonico: utenteAtualizado.telefone || null,
      situacao_clinica: utenteAtualizado.situacaoClinica.join('\n') || null,
      notas: utenteAtualizado.notas || null,
    }),
  });
  return mapearUtente(dto);
}

// Alterar prioridade/complexidade/equipa são endpoints próprios (não fazem
// parte do PUT) porque cada um gera um registo de histórico auditável.
export async function alterarPrioridade(utenteId: Utente['id'], nivelUrgenciaId: number, motivo: string): Promise<void> {
  await apiFetch(`/utentes/${utenteId}/prioridade`, {
    method: 'POST',
    body: JSON.stringify({ nivel_urgencia_id: nivelUrgenciaId, motivo }),
  });
}

export async function alterarComplexidade(utenteId: Utente['id'], nivelComplexidadeId: number, observacao?: string): Promise<void> {
  await apiFetch(`/utentes/${utenteId}/complexidade`, {
    method: 'POST',
    body: JSON.stringify({ nivel_complexidade_id: nivelComplexidadeId, observacao: observacao || null }),
  });
}

export async function alterarEquipaResponsavel(utenteId: Utente['id'], equipaId: number, motivo?: string): Promise<void> {
  await apiFetch(`/utentes/${utenteId}/equipa`, {
    method: 'POST',
    body: JSON.stringify({ equipa_id: equipaId, motivo: motivo || null }),
  });
}
