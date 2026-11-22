import type {
  BloqueioViatura,
  FiltrosBloqueiosViatura,
  NovoBloqueioViatura,
  Viatura,
} from '../types/viatura';
import { apiFetch } from './apiClient';

// Este serviço funciona com um fallback local: se a API de viaturas falhar (ex.: endpoint
// ainda não implementado no backend ou indisponível), os dados são lidos/escritos em
// localStorage para que a funcionalidade continue a funcionar no frontend de forma isolada.
const STORAGE_VIATURAS = 'ulsba_viaturas_local_v1';
const STORAGE_DEPOSITOS = 'ulsba_viaturas_depositos_v1';
const STORAGE_BLOQUEIOS = 'ulsba_viaturas_bloqueios_v1';

// Conjunto de viaturas de exemplo usado para popular o armazenamento local
// na primeira utilização (quando ainda não existe nada guardado).
const VIATURAS_FICTICIAS: Viatura[] = [
  {
    id: 1,
    matricula: 'AA-12-BB',
    designacao: 'Renault Kangoo',
    tipo_motorizacao: 'GASOLEO',
    capacidade_deposito: '54 L',
    autonomia: 780,
    unidade_autonomia: 'KM',
    lugares: 5,
    estado: 'OPERACIONAL',
    data_ultima_revisao: '2026-06-15',
    periodicidade_revisao_meses: 6,
    equipa_codigo: 'A',
  },
  {
    id: 2,
    matricula: 'CC-34-DD',
    designacao: 'Peugeot Partner',
    tipo_motorizacao: 'HIBRIDO',
    capacidade_deposito: '50 L / 12 kWh',
    autonomia: 650,
    unidade_autonomia: 'KM',
    lugares: 5,
    estado: 'OPERACIONAL',
    data_ultima_revisao: '2026-08-10',
    periodicidade_revisao_meses: 6,
    equipa_codigo: 'B',
  },
  {
    id: 3,
    matricula: 'EE-56-FF',
    designacao: 'Citroën Berlingo',
    tipo_motorizacao: 'ELETRICO',
    capacidade_deposito: '50 kWh',
    autonomia: 85,
    unidade_autonomia: 'PERCENTAGEM',
    lugares: 3,
    estado: 'EM_MANUTENCAO',
    data_ultima_revisao: '2026-05-02',
    periodicidade_revisao_meses: 6,
    equipa_codigo: null,
  },
];

// Lê do localStorage o mapa {viaturaId: capacidade do depósito}. Isto existe em separado
// das viaturas porque a API pode não devolver este campo (ver uso em getViaturas).
function lerDepositosLocais(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_DEPOSITOS);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch {
    return {};
  }
}

// Guarda (ou remove, se vazio) a capacidade do depósito de uma viatura no localStorage.
function guardarDepositoLocal(viaturaId: number, deposito?: string | null) {
  const mapa = lerDepositosLocais();
  if (deposito && deposito.trim()) {
    mapa[viaturaId] = deposito.trim();
  } else {
    delete mapa[viaturaId];
  }
  localStorage.setItem(STORAGE_DEPOSITOS, JSON.stringify(mapa));
}

// Lê as viaturas guardadas em localStorage; se não existir nada ainda (ou o
// conteúdo estiver corrompido), inicializa com as viaturas fictícias.
function lerViaturasLocais(): Viatura[] {
  try {
    const raw = localStorage.getItem(STORAGE_VIATURAS);
    if (raw) {
      const parsed = JSON.parse(raw) as Viatura[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignora erros de parsing e repõe as viaturas fictícias
  }
  localStorage.setItem(STORAGE_VIATURAS, JSON.stringify(VIATURAS_FICTICIAS));
  return VIATURAS_FICTICIAS;
}

function guardarViaturasLocais(lista: Viatura[]) {
  localStorage.setItem(STORAGE_VIATURAS, JSON.stringify(lista));
}

// Lê os bloqueios (ex.: períodos de manutenção/indisponibilidade) guardados localmente.
function lerBloqueiosLocais(): BloqueioViatura[] {
  try {
    const raw = localStorage.getItem(STORAGE_BLOQUEIOS);
    return raw ? (JSON.parse(raw) as BloqueioViatura[]) : [];
  } catch {
    return [];
  }
}

function guardarBloqueiosLocais(lista: BloqueioViatura[]) {
  localStorage.setItem(STORAGE_BLOQUEIOS, JSON.stringify(lista));
}

// Aplica os filtros (viatura, intervalo de datas) à lista de bloqueios guardada
// localmente — espelha a filtragem que, com a API disponível, seria feita no backend.
function filtrarBloqueios(
  lista: BloqueioViatura[],
  filtros?: FiltrosBloqueiosViatura,
): BloqueioViatura[] {
  return lista.filter((b) => {
    if (filtros?.viaturaId !== undefined && b.viatura_id !== filtros.viaturaId) return false;
    if (filtros?.dataInicio && b.data_fim < filtros.dataInicio) return false;
    if (filtros?.dataFim && b.data_inicio > filtros.dataFim) return false;
    return true;
  });
}

// Verifica se uma viatura tem algum bloqueio que cubra o dia indicado (formato ISO).
export function viaturaBloqueadaNoDia(
  bloqueios: BloqueioViatura[],
  viaturaId: number,
  diaIso: string,
): BloqueioViatura | undefined {
  return bloqueios.find(
    (b) => b.viatura_id === viaturaId && b.data_inicio <= diaIso && b.data_fim >= diaIso,
  );
}

// Lista as viaturas: tenta primeiro a API; se a capacidade do depósito não vier
// preenchida (campo ainda não suportado no backend), completa-se com o valor
// guardado localmente. Em caso de falha da API, usa por completo o fallback local.
export async function getViaturas(): Promise<Viatura[]> {
  try {
    const dados = await apiFetch<Viatura[]>('/viaturas');
    const depositos = lerDepositosLocais();
    const comDeposito = dados.map((v) => ({
      ...v,
      capacidade_deposito: v.capacidade_deposito ?? depositos[v.id] ?? null,
    }));
    guardarViaturasLocais(comDeposito);
    return comDeposito;
  } catch {
    return lerViaturasLocais();
  }
}

// Cria uma viatura: tenta a API e, se falhar, cria localmente com um id gerado
// incrementalmente (máximo dos ids existentes + 1).
export async function createViatura(novaViatura: Omit<Viatura, 'id'>): Promise<Viatura> {
  try {
    const criada = await apiFetch<Viatura>('/viaturas', {
      method: 'POST',
      body: JSON.stringify({
        matricula: novaViatura.matricula,
        designacao: novaViatura.designacao,
        tipo_motorizacao: novaViatura.tipo_motorizacao,
        lugares: novaViatura.lugares,
        autonomia: novaViatura.autonomia,
        unidade_autonomia: novaViatura.unidade_autonomia,
        estado: novaViatura.estado,
        data_ultima_revisao: novaViatura.data_ultima_revisao,
        periodicidade_revisao_meses: novaViatura.periodicidade_revisao_meses,
        equipa_codigo: novaViatura.equipa_codigo,
      }),
    });
    guardarDepositoLocal(criada.id, novaViatura.capacidade_deposito);
    return { ...criada, capacidade_deposito: novaViatura.capacidade_deposito ?? null };
  } catch {
    const atuais = lerViaturasLocais();
    const proximoId = atuais.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const criadaLocal: Viatura = { ...novaViatura, id: proximoId };
    guardarDepositoLocal(criadaLocal.id, novaViatura.capacidade_deposito);
    guardarViaturasLocais([...atuais, criadaLocal]);
    return criadaLocal;
  }
}

// Atualiza uma viatura: tenta a API e, se falhar, atualiza apenas o registo local.
export async function updateViatura(viaturaAtualizada: Viatura): Promise<Viatura> {
  try {
    const atualizada = await apiFetch<Viatura>(`/viaturas/${viaturaAtualizada.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        matricula: viaturaAtualizada.matricula,
        designacao: viaturaAtualizada.designacao,
        tipo_motorizacao: viaturaAtualizada.tipo_motorizacao,
        lugares: viaturaAtualizada.lugares,
        autonomia: viaturaAtualizada.autonomia,
        unidade_autonomia: viaturaAtualizada.unidade_autonomia,
        estado: viaturaAtualizada.estado,
        data_ultima_revisao: viaturaAtualizada.data_ultima_revisao,
        periodicidade_revisao_meses: viaturaAtualizada.periodicidade_revisao_meses,
        equipa_codigo: viaturaAtualizada.equipa_codigo,
      }),
    });
    guardarDepositoLocal(atualizada.id, viaturaAtualizada.capacidade_deposito);
    return { ...atualizada, capacidade_deposito: viaturaAtualizada.capacidade_deposito ?? null };
  } catch {
    const atuais = lerViaturasLocais();
    guardarDepositoLocal(viaturaAtualizada.id, viaturaAtualizada.capacidade_deposito);
    const novaLista = atuais.map((v) => (v.id === viaturaAtualizada.id ? viaturaAtualizada : v));
    guardarViaturasLocais(novaLista);
    return viaturaAtualizada;
  }
}

// Lista bloqueios de viaturas, com filtros opcionais. Quando a chamada sem filtros
// tem sucesso, atualiza a cópia local completa (serve de cache para o fallback);
// se a API falhar, filtra a cópia local para simular o comportamento do backend.
export async function getBloqueiosViaturas(
  filtros?: FiltrosBloqueiosViatura,
): Promise<BloqueioViatura[]> {
  try {
    const parametros = new URLSearchParams();
    if (filtros?.viaturaId !== undefined) {
      parametros.set('viatura_id', String(filtros.viaturaId));
    }
    if (filtros?.dataInicio) {
      parametros.set('data_inicio', filtros.dataInicio);
    }
    if (filtros?.dataFim) {
      parametros.set('data_fim', filtros.dataFim);
    }
    const qs = parametros.toString();
    const dados = await apiFetch<BloqueioViatura[]>(`/viaturas/bloqueios${qs ? `?${qs}` : ''}`);
    if (!filtros || (!filtros.viaturaId && !filtros.dataInicio && !filtros.dataFim)) {
      guardarBloqueiosLocais(dados);
    }
    return dados;
  } catch {
    return filtrarBloqueios(lerBloqueiosLocais(), filtros);
  }
}

// Cria um bloqueio (ex.: manutenção) para uma viatura num intervalo de datas.
// Se data_fim não for indicada, assume-se igual a data_inicio (bloqueio de um só dia).
export async function criarBloqueioViatura(
  viaturaId: number,
  dados: NovoBloqueioViatura,
): Promise<BloqueioViatura> {
  const dataFim = dados.data_fim || dados.data_inicio;
  try {
    const criado = await apiFetch<BloqueioViatura>(`/viaturas/${viaturaId}/bloqueios`, {
      method: 'POST',
      body: JSON.stringify({
        data_inicio: dados.data_inicio,
        data_fim: dataFim,
        tipo: dados.tipo,
        motivo: dados.motivo || null,
      }),
    });
    const atuais = lerBloqueiosLocais().filter((b) => b.id !== criado.id);
    guardarBloqueiosLocais([...atuais, criado]);
    return criado;
  } catch {
    const atuais = lerBloqueiosLocais();
    const proximoId = atuais.reduce((max, b) => Math.max(max, b.id), 0) + 1;
    const criadoLocal: BloqueioViatura = {
      id: proximoId,
      viatura_id: viaturaId,
      data_inicio: dados.data_inicio,
      data_fim: dataFim,
      tipo: dados.tipo,
      motivo: dados.motivo?.trim() || null,
    };
    guardarBloqueiosLocais([...atuais, criadoLocal]);
    return criadoLocal;
  }
}

// Remove um bloqueio de viatura. Tenta sempre remover também localmente,
// mesmo que a chamada à API falhe, para manter a cópia local consistente.
export async function removerBloqueioViatura(bloqueioId: number): Promise<void> {
  try {
    await apiFetch<void>(`/viaturas/bloqueios/${bloqueioId}`, {
      method: 'DELETE',
    });
  } catch {
    // Continua para remover do armazenamento local caso a API não esteja disponível
  }
  const atuais = lerBloqueiosLocais();
  guardarBloqueiosLocais(atuais.filter((b) => b.id !== bloqueioId));
}
// Sem fallback local: ao contrário das restantes funções deste serviço, uma
// falha a apagar não deve ser escondida — o utilizador tem de saber que não
// resultou. Se tiver voltas associadas, o backend desativa-a (INATIVA) em
// vez de apagar fisicamente (devolve "desativada").
export async function deleteViatura(viaturaId: number): Promise<{ apagada: boolean; desativada: boolean }> {
  return apiFetch<{ apagada: boolean; desativada: boolean }>(`/viaturas/${viaturaId}`, {
    method: 'DELETE',
  });
}
