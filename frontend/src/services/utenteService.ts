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

// TODO: criar/editar ainda enviam o Utente do frontend tal como está — os nomes
// dos campos não correspondem ao que o backend espera (UtenteCriar/UtenteEditar
// usam numero_utente, data_nascimento, local_id, etc.). Fica por resolver.
export async function createUtente(novoUtente: Omit<Utente, 'id'>): Promise<Utente> {
  const dto = await apiFetch<UtenteDTO>('/utentes', {
    method: 'POST',
    body: JSON.stringify(novoUtente),
  });
  return mapearUtente(dto);
}

export async function updateUtente(utenteAtualizado: Utente): Promise<Utente> {
  const dto = await apiFetch<UtenteDTO>(`/utentes/${utenteAtualizado.id}`, {
    method: 'PUT',
    body: JSON.stringify(utenteAtualizado),
  });
  return mapearUtente(dto);
}
