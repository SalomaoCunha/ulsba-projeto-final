import type { Page } from '@playwright/test';

// Data fixa dos testes: o browser arranca com o relógio neste instante, para
// que o mês mostrado na Agenda (e os dados mockados) sejam sempre os mesmos,
// independentemente do dia em que o CI corre.
export const AGORA_TESTE = new Date('2026-11-01T08:00:00Z');

const MES_TESTE = '2026-11';

// PNG transparente 1x1 servido no lugar dos tiles do OpenStreetMap: mantém o
// Leaflet funcional sem depender da rede externa.
const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const utilizadorAtual = {
  id: 1,
  nome: 'Enf. Ana Silva',
  perfil: 'COORDENADOR',
  vista_geral: true,
};

// Utentes no formato snake_case devolvido pela API (ver utenteService).
const utentes = [
  {
    utente_id: 1,
    numero_utente: 'U001',
    nome: 'Maria Santos',
    estado: 'ATIVO',
    data_nascimento: '1940-05-10',
    ultima_visita: `${MES_TESTE}-10`,
    contacto_telefonico: '284 000 001',
    equipa_responsavel_codigo: 'A',
    urgencia_designacao: 'Urgente 0 dias',
    complexidade_designacao: 'Complexo',
    morada: 'Rua da Saúde 1',
    codigo_postal: '7800-001',
    localidade: 'Beja',
    concelho: 'Beja',
    cuidador_principal_nome: 'Filha da Maria',
    situacao_clinica: 'Doença avançada',
    notas: 'Sem notas',
    lat: 38.015,
    lng: -7.863,
  },
  {
    utente_id: 2,
    numero_utente: 'U002',
    nome: 'João Pereira',
    estado: 'ATIVO',
    data_nascimento: '1945-02-20',
    ultima_visita: `${MES_TESTE}-12`,
    contacto_telefonico: '284 000 002',
    equipa_responsavel_codigo: 'A',
    urgencia_designacao: 'Urgente 1 dia',
    complexidade_designacao: 'Não complexo',
    morada: 'Rua do Carmo 2',
    codigo_postal: '7800-002',
    localidade: 'Beja',
    concelho: 'Beja',
    cuidador_principal_nome: 'Filho do João',
    situacao_clinica: 'Doença crónica',
    notas: null,
    lat: 38.02,
    lng: -7.85,
  },
  {
    utente_id: 3,
    numero_utente: 'U003',
    nome: 'Ana Costa',
    estado: 'ATIVO',
    data_nascimento: '1950-09-03',
    ultima_visita: `${MES_TESTE}-17`,
    contacto_telefonico: '284 000 003',
    equipa_responsavel_codigo: 'B',
    urgencia_designacao: 'Não urgente 1',
    complexidade_designacao: 'Altamente complexo',
    morada: 'Rua de Moura 3',
    codigo_postal: '7860-003',
    localidade: 'Moura',
    concelho: 'Moura',
    cuidador_principal_nome: 'Irmã da Ana',
    situacao_clinica: 'Doença oncológica',
    notas: 'Sem notas',
    lat: 38.14,
    lng: -7.45,
  },
];

// Equipas no formato devolvido diretamente por /equipas.
const equipas = [
  {
    id: 1,
    codigo: 'A',
    designacao: 'Equipa A',
    ativa: true,
    membros: [
      { id: 10, nome: 'Enf. Ana Silva', funcao: 'Enfermeira' },
      { id: 11, nome: 'Dr. Bruno Costa', funcao: 'Médico' },
    ],
  },
  {
    id: 2,
    codigo: 'B',
    designacao: 'Equipa B',
    ativa: true,
    membros: [{ id: 12, nome: 'Enf. Carla Dias', funcao: 'Enfermeira' }],
  },
];

// Viaturas no formato snake_case (ver types/viatura.ts).
const viaturas = [
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
    data_ultima_revisao: `${MES_TESTE}-01`,
    periodicidade_revisao_meses: 6,
    equipa_codigo: 'A',
  },
  {
    id: 2,
    matricula: 'CC-34-DD',
    designacao: 'Citroën Berlingo',
    tipo_motorizacao: 'ELETRICO',
    capacidade_deposito: '50 kWh',
    autonomia: 85,
    unidade_autonomia: 'PERCENTAGEM',
    lugares: 5,
    estado: 'EM_MANUTENCAO',
    data_ultima_revisao: `${MES_TESTE}-02`,
    periodicidade_revisao_meses: 6,
    equipa_codigo: 'B',
  },
];

// Bloqueios de viatura do mês de teste (formato da API).
const bloqueios = [
  {
    id: 1,
    viatura_id: 1,
    data_inicio: `${MES_TESTE}-18`,
    data_fim: `${MES_TESTE}-19`,
    tipo: 'MANUTENCAO',
    motivo: 'Revisão programada',
  },
];

// Voltas do mês de teste (formato da API), usadas na Agenda e nos bloqueios.
const voltas = [
  {
    id: 1,
    data: `${MES_TESTE}-10`,
    designacao: 'Volta Beja Centro',
    estado: 'CONFIRMADA',
    equipa_id: 1,
    equipa_codigo: 'A',
    viatura_id: 1,
    viatura_matricula: 'AA-12-BB',
    partida_prevista: `${MES_TESTE}-10T09:00:00`,
    regresso_previsto: `${MES_TESTE}-10T13:00:00`,
  },
  {
    id: 2,
    data: `${MES_TESTE}-12`,
    designacao: 'Volta Moura',
    estado: 'RASCUNHO',
    equipa_id: 2,
    equipa_codigo: 'B',
    viatura_id: 2,
    viatura_matricula: 'CC-34-DD',
    partida_prevista: `${MES_TESTE}-12T14:00:00`,
    regresso_previsto: `${MES_TESTE}-12T17:30:00`,
  },
  {
    id: 3,
    data: `${MES_TESTE}-17`,
    designacao: 'Volta Serpa',
    estado: 'CONCLUIDA',
    equipa_id: 1,
    equipa_codigo: 'A',
    viatura_id: 1,
    viatura_matricula: 'AA-12-BB',
    partida_prevista: `${MES_TESTE}-17T10:00:00`,
    regresso_previsto: `${MES_TESTE}-17T12:00:00`,
  },
];

// Visitas no formato de /voltas/visitas (vista Utente).
const visitas = [
  {
    visita_id: 1,
    volta_id: 1,
    data_volta: `${MES_TESTE}-10`,
    volta_estado: 'CONFIRMADA',
    utente_id: 1,
    utente_nome: 'Maria Santos',
    utente_numero: 'U001',
    visita_estado: 'PLANEADA',
    inicio_previsto: `${MES_TESTE}-10T09:30:00`,
    fim_previsto: `${MES_TESTE}-10T10:15:00`,
    inicio_real: null,
    fim_real: null,
    equipa_codigo: 'A',
    viatura_matricula: 'AA-12-BB',
    local_nome: 'Domicílio',
    local_morada: 'Rua da Saúde 1',
  },
];

function respostaPara(caminho: string): unknown | null {
  switch (caminho) {
    case '/auth/me':
      return utilizadorAtual;
    case '/utentes':
      return utentes;
    case '/equipas':
      return equipas;
    case '/viaturas':
      return viaturas;
    case '/viaturas/bloqueios':
      return bloqueios;
    case '/voltas':
      return voltas;
    case '/voltas/visitas':
      return visitas;
    default:
      return null;
  }
}

// Instala, antes de qualquer navegação, o relógio fixo, a sessão fake e os
// mocks da API. Nenhum pedido sai para o backend real nem para a internet.
export async function prepararPagina(page: Page) {
  await page.clock.install({ time: AGORA_TESTE });

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'token-e2e');
  });

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost';

    if (local && url.pathname.startsWith('/api/v1/')) {
      const caminho = url.pathname.replace('/api/v1', '');
      const corpo = respostaPara(caminho);
      if (corpo === null) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `Sem mock para ${caminho}` }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(corpo),
      });
      return;
    }

    if (local) {
      await route.continue();
      return;
    }

    if (url.hostname.endsWith('tile.openstreetmap.org')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(PNG_1X1, 'base64'),
      });
      return;
    }

    // Qualquer outro pedido externo é bloqueado: os testes ficam offline e
    // determinísticos.
    await route.abort();
  });
}

// Verifica que o documento não tem overflow horizontal (scroll lateral).
export async function semScrollHorizontal(page: Page) {
  const medidas = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    cliente: document.documentElement.clientWidth,
  }));
  return medidas;
}
