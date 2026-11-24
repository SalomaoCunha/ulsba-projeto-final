import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  getViaturas,
  createViatura,
  updateViatura,
  deleteViatura,
  getBloqueiosViaturas,
  criarBloqueioViatura,
  removerBloqueioViatura,
  viaturaBloqueadaNoDia,
} from '../services/viaturaService';
import { getEquipas } from '../services/equipaService';
import type {
  BloqueioViatura,
  EstadoViatura,
  TipoBloqueioViatura,
  TipoMotorizacao,
  UnidadeAutonomia,
  Viatura,
} from '../types/viatura';
import type { Equipa } from '../types/equipa';
import EcraCarregamento from '../components/EcraCarregamento';
import ModalConfirmacao from '../components/ModalConfirmacao';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';

const LABEL_MOTORIZACAO: Record<TipoMotorizacao, string> = {
  GASOLINA: 'Gasolina',
  GASOLEO: 'Gasóleo',
  HIBRIDO: 'Híbrido',
  ELETRICO: 'Elétrico',
  OUTRO: 'Outro',
};

const LABEL_ESTADO: Record<EstadoViatura, string> = {
  OPERACIONAL: 'Ativa',
  EM_MANUTENCAO: 'Em revisão',
  INATIVA: 'Inativa',
};

const LABEL_TIPO_BLOQUEIO: Record<TipoBloqueioViatura, string> = {
  MANUTENCAO: 'Manutenção',
  INDISPONIBILIDADE: 'Indisponibilidade pontual',
};

// Calcula a data da próxima revisão a partir da última revisão + periodicidade
// (em meses). Devolve "—" se algum dos dois dados não estiver preenchido.
const calcularProximaRevisao = (viatura: Viatura) => {
  if (!viatura.data_ultima_revisao || !viatura.periodicidade_revisao_meses) {
    return '—';
  }
  const data = new Date(viatura.data_ultima_revisao);
  data.setMonth(data.getMonth() + viatura.periodicidade_revisao_meses);
  return data.toLocaleDateString('pt-PT');
};

// Formata uma data ISO (yyyy-MM-dd ou timestamp completo) para dd/mm/aaaa,
// sem passar por Date/timezone — evita que uma data "pura" (sem hora) mude
// de dia por causa da conversão para o timezone local do browser.
const formatarDataPt = (dataIso: string) => {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
};

// Converte uma data (ou null/undefined) para o formato yyyy-MM-dd que os
// inputs type="date" esperam.
const formatarDataParaInput = (dataStr?: string | null) => {
  if (!dataStr) return '';
  return dataStr.slice(0, 10);
};

// Gestão de frota: lista de viaturas com os respetivos dados (combustível,
// autonomia, revisões, equipa associada) e dois modais — um para criar/editar
// uma viatura, outro para gerir os bloqueios/impedimentos por dia de cada viatura.
const ViaturasPage: React.FC = () => {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioViatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | EstadoViatura>('TODAS');

  // Modal de edição/criação de viatura
  const [viaturaEmEdicao, setViaturaEmEdicao] = useState<Viatura | null>(null);
  const [modoCriacao, setModoCriacao] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [aApagarId, setAApagarId] = useState<number | null>(null);
  const [avisoApagar, setAvisoApagar] = useState<string | null>(null);
  const [viaturaParaApagar, setViaturaParaApagar] = useState<Viatura | null>(null);

  // Modal de bloqueios por dia (impedimentos)
  const [viaturaBloqueiosModal, setViaturaBloqueiosModal] = useState<Viatura | null>(null);
  const hojeIso = format(new Date(), 'yyyy-MM-dd');
  const [novoBloqueioInicio, setNovoBloqueioInicio] = useState(hojeIso);
  const [novoBloqueioFim, setNovoBloqueioFim] = useState(hojeIso);
  const [novoBloqueioTipo, setNovoBloqueioTipo] = useState<TipoBloqueioViatura>('MANUTENCAO');
  const [novoBloqueioMotivo, setNovoBloqueioMotivo] = useState('');
  const [erroBloqueio, setErroBloqueio] = useState<string | null>(null);
  const [aGuardarBloqueio, setAGuardarBloqueio] = useState(false);
  const [bloqueioParaRemover, setBloqueioParaRemover] = useState<BloqueioViatura | null>(null);
  const [aRemoverBloqueio, setARemoverBloqueio] = useState(false);

  const navigate = useNavigate();

  // Carrega viaturas, bloqueios e equipas em paralelo. Usa allSettled (em vez
  // de all) para que a falha de um dos pedidos não impeça os outros dois de
  // preencher o ecrã.
  useEffect(() => {
    comAtrasoMinimo(
      Promise.allSettled([
        getViaturas().then(setViaturas),
        getBloqueiosViaturas().then(setBloqueios),
        getEquipas().then(setEquipas),
      ]),
    ).finally(() => setCarregando(false));
  }, []);

  // Lista de equipas para o select do modal de edição. Se o backend ainda
  // não tiver equipas carregadas (ou devolver lista vazia), cai-se para as
  // três equipas fixas A/B/C como alternativa de recurso.
  const codigosEquipas =
    equipas.length > 0
      ? equipas.map((eq) => ({ codigo: eq.codigo, label: `Equipa ${eq.codigo}` }))
      : [
          { codigo: 'A', label: 'Equipa A' },
          { codigo: 'B', label: 'Equipa B' },
          { codigo: 'C', label: 'Equipa C' },
        ];

  const nomeDaEquipa = (equipaCodigo: string | null) => {
    return equipaCodigo ? `Equipa ${equipaCodigo}` : 'Sem equipa atribuída';
  };

  // Badge colorido conforme o estado da viatura (ativa/em revisão/inativa).
  const getBadgeEstado = (estado: EstadoViatura) => {
    const estilos: Record<EstadoViatura, string> = {
      OPERACIONAL: 'bg-success-subtle text-success border-success-subtle',
      INATIVA: 'bg-secondary-subtle text-secondary border-secondary-subtle',
      EM_MANUTENCAO: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    };
    return (
      <span className={`badge border px-2 py-1 rounded-pill ${estilos[estado]}`}>
        {LABEL_ESTADO[estado]}
      </span>
    );
  };

  // Conta bloqueios ainda em vigor ou futuros (ignora os que já terminaram),
  // usado para mostrar o indicador "N bloqueios" junto ao estado da viatura.
  const contarBloqueiosFuturos = (viaturaId: number) =>
    bloqueios.filter((b) => b.viatura_id === viaturaId && b.data_fim >= hojeIso).length;

  // Abre o modal de edição em modo criação, pré-preenchido com valores
  // por omissão razoáveis (id 0 é só um marcador — nunca é enviado ao backend).
  const abrirModalNova = () => {
    setModoCriacao(true);
    setViaturaEmEdicao({
      id: 0,
      matricula: '',
      designacao: '',
      tipo_motorizacao: 'GASOLEO',
      capacidade_deposito: '50 L',
      autonomia: 600,
      unidade_autonomia: 'KM',
      lugares: 5,
      equipa_codigo: null,
      data_ultima_revisao: null,
      periodicidade_revisao_meses: 12,
      estado: 'OPERACIONAL',
    });
  };

  // Abre o modal de edição com uma cópia da viatura (para não mutar o estado
  // da lista diretamente enquanto o utilizador edita os campos).
  const abrirModalEdicao = (viatura: Viatura) => {
    setModoCriacao(false);
    setViaturaEmEdicao({ ...viatura });
  };

  const fecharModalEdicao = () => {
    setViaturaEmEdicao(null);
    setModoCriacao(false);
  };

  // Apaga a viatura. Se o backend detetar que a viatura tem voltas associadas,
  // não a apaga de facto — marca-a como Inativa em alternativa — por isso o
  // resultado tem de ser inspecionado para decidir que atualização fazer à
  // lista local e que aviso mostrar ao utilizador.
  const apagarViatura = async (viatura: Viatura) => {
    setAApagarId(viatura.id);
    setAvisoApagar(null);
    try {
      const resultado = await deleteViatura(viatura.id);
      if (resultado.apagada) {
        setViaturas((atuais) => atuais.filter((v) => v.id !== viatura.id));
      } else {
        // Tem voltas associadas — o backend desativou-a em vez de apagar.
        setViaturas((atuais) =>
          atuais.map((v) => (v.id === viatura.id ? { ...v, estado: 'INATIVA' } : v)),
        );
        setAvisoApagar(
          `A viatura ${viatura.matricula} tem voltas associadas e por isso foi marcada como Inativa em vez de apagada.`,
        );
      }
    } catch (erro) {
      console.error('Falha ao apagar viatura:', erro);
      setAvisoApagar('Não foi possível apagar a viatura.');
    } finally {
      setAApagarId(null);
      setViaturaParaApagar(null);
    }
  };

  // Abre o modal de bloqueios para a viatura indicada, repondo o formulário
  // de "novo bloqueio" para o estado inicial (data de hoje, sem motivo).
  const abrirModalBloqueios = (viatura: Viatura) => {
    setViaturaBloqueiosModal(viatura);
    setNovoBloqueioInicio(hojeIso);
    setNovoBloqueioFim(hojeIso);
    setNovoBloqueioTipo('MANUTENCAO');
    setNovoBloqueioMotivo('');
    setErroBloqueio(null);
  };

  const fecharModalBloqueios = () => {
    setViaturaBloqueiosModal(null);
    setErroBloqueio(null);
  };

  // Submete o formulário do modal de criação/edição de viatura. Em modo
  // criação descarta o id (0, só um marcador local) antes de enviar o
  // payload, porque o id real é atribuído pelo backend.
  const handleGuardarViatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viaturaEmEdicao) return;
    setAGuardar(true);

    try {
      if (modoCriacao) {
        const { id: _id, ...payload } = viaturaEmEdicao;
        const criada = await createViatura(payload);
        setViaturas((prev) => [...prev, criada]);
      } else {
        const atualizada = await updateViatura(viaturaEmEdicao);
        setViaturas((prev) => prev.map((v) => (v.id === atualizada.id ? atualizada : v)));
      }
      fecharModalEdicao();
    } finally {
      setAGuardar(false);
    }
  };

  // Regista um novo bloqueio/impedimento para a viatura do modal. Valida que
  // a data de início foi indicada e que a data de fim (se vazia, assume-se
  // igual à de início — bloqueio de um único dia) não é anterior ao início.
  const handleAdicionarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viaturaBloqueiosModal) return;
    setErroBloqueio(null);

    if (!novoBloqueioInicio) {
      setErroBloqueio('Selecione a data de início do bloqueio.');
      return;
    }

    const fimEfetivo = novoBloqueioFim || novoBloqueioInicio;
    if (fimEfetivo < novoBloqueioInicio) {
      setErroBloqueio('A data de fim não pode ser anterior à data de início.');
      return;
    }

    setAGuardarBloqueio(true);
    try {
      const criado = await criarBloqueioViatura(viaturaBloqueiosModal.id, {
        data_inicio: novoBloqueioInicio,
        data_fim: fimEfetivo,
        tipo: novoBloqueioTipo,
        motivo: novoBloqueioMotivo.trim() || null,
      });
      setBloqueios((prev) => [...prev, criado].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)));
      setNovoBloqueioMotivo('');
    } catch (err) {
      setErroBloqueio(err instanceof Error ? err.message : 'Não foi possível registar o bloqueio.');
    } finally {
      setAGuardarBloqueio(false);
    }
  };

  const handleRemoverBloqueio = async (bloqueio: BloqueioViatura) => {
    setARemoverBloqueio(true);
    try {
      await removerBloqueioViatura(bloqueio.id);
      setBloqueios((prev) => prev.filter((b) => b.id !== bloqueio.id));
    } finally {
      setARemoverBloqueio(false);
      setBloqueioParaRemover(null);
    }
  };

  // Lista filtrada pelo estado selecionado nos botões de filtro acima da tabela.
  const viaturasFiltradas =
    filtroEstado === 'TODAS' ? viaturas : viaturas.filter((v) => v.estado === filtroEstado);

  // Estado de bloqueio resolvido uma única vez por viatura, para a tabela
  // (desktop) e os cartões (mobile) partilharem os mesmos cálculos.
  const viaturasComEstado = viaturasFiltradas.map((viatura) => ({
    viatura,
    bloqueadaHoje: viaturaBloqueadaNoDia(bloqueios, viatura.id, hojeIso),
    totalBloqueios: contarBloqueiosFuturos(viatura.id),
  }));

  // Bloqueios da viatura atualmente aberta no modal de impedimentos,
  // ordenados por data de início.
  const bloqueiosDaViaturaModal = viaturaBloqueiosModal
    ? bloqueios
        .filter((b) => b.viatura_id === viaturaBloqueiosModal.id)
        .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    : [];

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Viaturas</h1>
          <p className="text-muted mb-0 small">
            Gestão de frota, combustível, autonomia, revisões, equipas e bloqueios por dia
          </p>
        </div>
        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={abrirModalNova}
        >
          <i className="bi bi-plus-lg"></i>
          Nova Viatura
        </button>
      </div>

      {avisoApagar && (
        <div className="alert alert-warning alert-dismissible" role="alert">
          {avisoApagar}
          <button type="button" className="btn-close" onClick={() => setAvisoApagar(null)} aria-label="Fechar"></button>
        </div>
      )}

      {/* Filtros por Estado */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {(
          [
            ['TODAS', 'Todas'],
            ['OPERACIONAL', 'Ativas'],
            ['EM_MANUTENCAO', 'Em revisão'],
            ['INATIVA', 'Inativas'],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            className={`btn btn-sm ${
              filtroEstado === valor ? 'btn-success' : 'btn-outline-secondary bg-white'
            }`}
            onClick={() => setFiltroEstado(valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {/* Cartão Branco Principal — tabela em desktop e cartões em mobile.
          As duas vistas partilham os mesmos helpers e cálculos (viaturasComEstado). */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden ulsba-table-card-shell">

        {/* Cartões — só em mobile (<md): leitura e toque sem scroll horizontal */}
        <div className="d-md-none">
          {viaturasComEstado.length === 0 ? (
            <div className="p-3 text-muted small">Sem viaturas para mostrar.</div>
          ) : (
            viaturasComEstado.map(({ viatura, bloqueadaHoje, totalBloqueios }) => (
              <div key={viatura.id} className="p-3 border-bottom">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-dark text-truncate">{viatura.matricula}</div>
                    <div className="small text-muted text-truncate">{viatura.designacao ?? 'Sem modelo'}</div>
                  </div>
                  <div className="d-flex flex-wrap justify-content-end gap-1 flex-shrink-0">
                    {getBadgeEstado(viatura.estado)}
                    {bloqueadaHoje && (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2">
                        Bloqueada hoje
                      </span>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
                  <span>
                    <i className="bi bi-fuel-pump me-1"></i>
                    {LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao}
                    {viatura.capacidade_deposito ? ` (${viatura.capacidade_deposito})` : ''}
                  </span>
                  <span>
                    <i className="bi bi-speedometer2 me-1"></i>
                    {viatura.autonomia ?? '—'}{' '}
                    {viatura.unidade_autonomia === 'KM'
                      ? 'km'
                      : viatura.unidade_autonomia === 'PERCENTAGEM'
                        ? '%'
                        : ''}
                  </span>
                  <span>
                    <i className="bi bi-people me-1"></i>
                    {viatura.lugares} lugares
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-3 mt-1 small text-muted">
                  <span>
                    <i className="bi bi-people-fill me-1"></i>
                    {viatura.equipa_codigo ? (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none text-success fw-medium"
                        onClick={() => navigate('/equipas')}
                      >
                        {nomeDaEquipa(viatura.equipa_codigo)}
                      </button>
                    ) : (
                      <span>Sem equipa atribuída</span>
                    )}
                  </span>
                  <span>
                    <i className="bi bi-calendar-check me-1"></i>
                    Próxima revisão: {calcularProximaRevisao(viatura)}
                  </span>
                </div>

                {totalBloqueios > 0 && (
                  <div className="mt-1">
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">
                      {totalBloqueios} {totalBloqueios === 1 ? 'bloqueio' : 'bloqueios'}
                    </span>
                  </div>
                )}

                <div className="viaturas-mobile-actions d-flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border text-danger flex-fill py-2"
                    title="Gerir bloqueios / impedimentos por dia"
                    aria-label={`Gerir bloqueios de ${viatura.matricula}`}
                    onClick={() => abrirModalBloqueios(viatura)}
                  >
                    <i className="bi bi-calendar-x me-1"></i>
                    <span className="d-none d-sm-inline">Bloqueios</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border text-secondary flex-fill py-2"
                    title="Agendar no calendário"
                    aria-label={`Agendar ${viatura.matricula} no calendário`}
                    onClick={() => navigate(`/agenda?viaturaId=${viatura.id}`)}
                  >
                    <i className="bi bi-calendar3 me-1"></i>
                    <span className="d-none d-sm-inline">Calendário</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border text-secondary flex-fill py-2"
                    title="Editar viatura"
                    aria-label={`Editar ${viatura.matricula}`}
                    onClick={() => abrirModalEdicao(viatura)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    <span className="d-none d-sm-inline">Editar</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border text-danger flex-fill py-2"
                    title="Apagar viatura"
                    aria-label={`Apagar ${viatura.matricula}`}
                    disabled={aApagarId === viatura.id}
                    onClick={() => setViaturaParaApagar(viatura)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    <span className="d-none d-sm-inline">Apagar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tabela — a partir de md */}
        <div className="table-responsive flex-grow-1 d-none d-md-block">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">Matrícula</th>
                <th className="fw-medium border-bottom-0 py-3">Modelo</th>
                <th className="fw-medium border-bottom-0 py-3">Combustível (Depósito)</th>
                <th className="fw-medium border-bottom-0 py-3">Autonomia</th>
                <th className="fw-medium border-bottom-0 py-3">Lugares</th>
                <th className="fw-medium border-bottom-0 py-3">Equipa</th>
                <th className="fw-medium border-bottom-0 py-3">Próxima Revisão</th>
                <th className="fw-medium border-bottom-0 py-3">Estado / Impedimentos</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {viaturasComEstado.map(({ viatura, bloqueadaHoje, totalBloqueios }) => {
                return (
                  <tr key={viatura.id}>
                    <td className="ps-4 py-3 fw-medium text-dark">{viatura.matricula}</td>
                    <td className="py-3 text-muted">{viatura.designacao ?? '—'}</td>
                    <td className="py-3 text-muted">
                      {LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao}
                      {viatura.capacidade_deposito ? ` (${viatura.capacidade_deposito})` : ''}
                    </td>
                    <td className="py-3 text-muted">
                      {viatura.autonomia ?? '—'}{' '}
                      {viatura.unidade_autonomia === 'KM'
                        ? 'km'
                        : viatura.unidade_autonomia === 'PERCENTAGEM'
                          ? '%'
                          : ''}
                    </td>
                    <td className="py-3 text-muted">{viatura.lugares}</td>
                    <td className="py-3">
                      {viatura.equipa_codigo ? (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-success fw-medium"
                          onClick={() => navigate('/equipas')}
                        >
                          {nomeDaEquipa(viatura.equipa_codigo)}
                        </button>
                      ) : (
                        <span className="text-muted">Sem equipa atribuída</span>
                      )}
                    </td>
                    <td className="py-3 text-muted">{calcularProximaRevisao(viatura)}</td>
                    <td className="py-3">
                      <div className="d-flex flex-wrap align-items-center gap-1">
                        {getBadgeEstado(viatura.estado)}
                        {bloqueadaHoje && (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2">
                            Bloqueada hoje
                          </span>
                        )}
                        {totalBloqueios > 0 && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 ms-1 text-decoration-none text-danger small"
                            onClick={() => abrirModalBloqueios(viatura)}
                          >
                            {totalBloqueios} {totalBloqueios === 1 ? 'bloqueio' : 'bloqueios'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="pe-4 py-3 text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger shadow-sm border me-1"
                        title="Gerir bloqueios / impedimentos por dia"
                        onClick={() => abrirModalBloqueios(viatura)}
                      >
                        <i className="bi bi-calendar-x"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-secondary shadow-sm border me-1"
                        title="Agendar no calendário"
                        onClick={() => navigate(`/agenda?viaturaId=${viatura.id}`)}
                      >
                        <i className="bi bi-calendar3"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-secondary shadow-sm border me-1"
                        title="Editar viatura"
                        onClick={() => abrirModalEdicao(viatura)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger shadow-sm border"
                        title="Apagar viatura"
                        disabled={aApagarId === viatura.id}
                        onClick={() => setViaturaParaApagar(viatura)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Viatura */}
      {viaturaEmEdicao && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleGuardarViatura}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {modoCriacao ? 'Nova Viatura' : `Editar Viatura — ${viaturaEmEdicao.matricula}`}
                  </h5>
                  <button type="button" className="btn-close" onClick={fecharModalEdicao}></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-muted">Matrícula *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={viaturaEmEdicao.matricula}
                        onChange={(e) =>
                          setViaturaEmEdicao({ ...viaturaEmEdicao, matricula: e.target.value })
                        }
                        placeholder="Ex: AA-12-BB"
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-muted">Modelo / Designação *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={viaturaEmEdicao.designacao ?? ''}
                        onChange={(e) =>
                          setViaturaEmEdicao({ ...viaturaEmEdicao, designacao: e.target.value })
                        }
                        placeholder="Ex: Renault Kangoo"
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-medium text-muted">Combustível</label>
                      <select
                        className="form-select"
                        value={viaturaEmEdicao.tipo_motorizacao}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            tipo_motorizacao: e.target.value as TipoMotorizacao,
                          })
                        }
                      >
                        {(Object.entries(LABEL_MOTORIZACAO) as [TipoMotorizacao, string][]).map(
                          ([chave, label]) => (
                            <option key={chave} value={chave}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-medium text-muted">Depósito / Bateria</label>
                      <input
                        type="text"
                        className="form-control"
                        value={viaturaEmEdicao.capacidade_deposito ?? ''}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            capacidade_deposito: e.target.value || null,
                          })
                        }
                        placeholder="Ex: 54 L ou 50 kWh"
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-medium text-muted">Autonomia</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={viaturaEmEdicao.autonomia ?? ''}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            autonomia: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-medium text-muted">Unidade</label>
                      <select
                        className="form-select"
                        value={viaturaEmEdicao.unidade_autonomia ?? 'KM'}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            unidade_autonomia: e.target.value as UnidadeAutonomia,
                          })
                        }
                      >
                        <option value="KM">km</option>
                        <option value="PERCENTAGEM">%</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-medium text-muted">Lugares</label>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        className="form-control"
                        value={viaturaEmEdicao.lugares}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            lugares: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-medium text-muted">Equipa Associada</label>
                      <select
                        className="form-select"
                        value={viaturaEmEdicao.equipa_codigo ?? ''}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            equipa_codigo: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Sem equipa atribuída</option>
                        {codigosEquipas.map((eq) => (
                          <option key={eq.codigo} value={eq.codigo}>
                            {eq.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-muted">Estado</label>
                      <select
                        className="form-select"
                        value={viaturaEmEdicao.estado}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            estado: e.target.value as EstadoViatura,
                          })
                        }
                      >
                        <option value="OPERACIONAL">Ativa</option>
                        <option value="EM_MANUTENCAO">Em revisão</option>
                        <option value="INATIVA">Inativa</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-muted">Última Revisão</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formatarDataParaInput(viaturaEmEdicao.data_ultima_revisao)}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            data_ultima_revisao: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-medium text-muted">
                        Periodicidade da Revisão (meses)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        className="form-control"
                        value={viaturaEmEdicao.periodicidade_revisao_meses ?? ''}
                        onChange={(e) =>
                          setViaturaEmEdicao({
                            ...viaturaEmEdicao,
                            periodicidade_revisao_meses:
                              e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light border" onClick={fecharModalEdicao}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success px-4" disabled={aGuardar}>
                    <i className="bi bi-save me-2"></i>
                    {aGuardar ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impedimentos / Bloqueios por Dia */}
      {viaturaBloqueiosModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    Impedimentos — {viaturaBloqueiosModal.matricula}
                  </h5>
                  <div className="small text-muted">
                    {viaturaBloqueiosModal.designacao ?? 'Sem modelo'} · Os dias bloqueados ficam marcados no calendário e excluídos do agendamento
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={fecharModalBloqueios}></button>
              </div>

              <div className="modal-body">
                {/* Formulário para registar novo bloqueio */}
                <form onSubmit={handleAdicionarBloqueio} className="bg-light rounded p-3 mb-4">
                  <h6 className="fw-bold small text-dark mb-3">Registar novo bloqueio por dia</h6>

                  {erroBloqueio && (
                    <div className="alert alert-danger py-2 small mb-3">{erroBloqueio}</div>
                  )}

                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted mb-1">Data início *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={novoBloqueioInicio}
                        onChange={(e) => {
                          setNovoBloqueioInicio(e.target.value);
                          if (!novoBloqueioFim || novoBloqueioFim < e.target.value) {
                            setNovoBloqueioFim(e.target.value);
                          }
                        }}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted mb-1">Data fim</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        min={novoBloqueioInicio}
                        value={novoBloqueioFim}
                        onChange={(e) => setNovoBloqueioFim(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted mb-1">Tipo de impedimento</label>
                      <select
                        className="form-select form-select-sm"
                        value={novoBloqueioTipo}
                        onChange={(e) =>
                          setNovoBloqueioTipo(e.target.value as TipoBloqueioViatura)
                        }
                      >
                        <option value="MANUTENCAO">Manutenção / Revisão</option>
                        <option value="INDISPONIBILIDADE">Indisponibilidade pontual</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-9">
                      <label className="form-label small text-muted mb-1">Motivo (opcional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ex: Revisão anual na oficina, inspeção periódica..."
                        value={novoBloqueioMotivo}
                        onChange={(e) => setNovoBloqueioMotivo(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-3 d-flex align-items-end">
                      <button
                        type="submit"
                        className="btn btn-danger btn-sm w-100"
                        disabled={aGuardarBloqueio}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        {aGuardarBloqueio ? 'A registar...' : 'Bloquear'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Lista de bloqueios registados */}
                <h6 className="fw-bold small text-dark mb-2">Bloqueios registados</h6>
                {bloqueiosDaViaturaModal.length === 0 ? (
                  <p className="text-muted small mb-0">
                    Esta viatura não tem dias bloqueados registados.
                  </p>
                ) : (
                  <div className="list-group list-group-flush border rounded">
                    {bloqueiosDaViaturaModal.map((bloq) => (
                      <div
                        key={bloq.id}
                        className="list-group-item d-flex justify-content-between align-items-center gap-2 py-2"
                      >
                        <div>
                          <div className="fw-medium small text-dark">
                            {bloq.data_inicio === bloq.data_fim
                              ? formatarDataPt(bloq.data_inicio)
                              : `${formatarDataPt(bloq.data_inicio)} → ${formatarDataPt(bloq.data_fim)}`}
                            <span
                              className={`badge ms-2 ${
                                bloq.tipo === 'MANUTENCAO'
                                  ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                  : 'bg-danger-subtle text-danger border border-danger-subtle'
                              }`}
                            >
                              {LABEL_TIPO_BLOQUEIO[bloq.tipo]}
                            </span>
                          </div>
                          {bloq.motivo && (
                            <div className="text-muted small">{bloq.motivo}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Remover bloqueio"
                          onClick={() => setBloqueioParaRemover(bloq)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    const id = viaturaBloqueiosModal.id;
                    fecharModalBloqueios();
                    navigate(`/agenda?viaturaId=${id}`);
                  }}
                >
                  <i className="bi bi-calendar3 me-1"></i>
                  Ver no Calendário
                </button>
                <button type="button" className="btn btn-light border btn-sm" onClick={fecharModalBloqueios}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={viaturaParaApagar !== null}
        titulo="Apagar viatura"
        mensagem={
          viaturaParaApagar && (
            <>
              Apagar a viatura <strong>{viaturaParaApagar.matricula}</strong>? Se tiver voltas associadas,
              fica marcada como Inativa em vez de apagada.
            </>
          )
        }
        aProcessar={viaturaParaApagar !== null && aApagarId === viaturaParaApagar.id}
        onConfirmar={() => viaturaParaApagar && apagarViatura(viaturaParaApagar)}
        onCancelar={() => setViaturaParaApagar(null)}
      />

      <ModalConfirmacao
        aberto={bloqueioParaRemover !== null}
        titulo="Remover bloqueio"
        mensagem={
          bloqueioParaRemover && (
            <>
              Remover o bloqueio de{' '}
              <strong>
                {bloqueioParaRemover.data_inicio === bloqueioParaRemover.data_fim
                  ? formatarDataPt(bloqueioParaRemover.data_inicio)
                  : `${formatarDataPt(bloqueioParaRemover.data_inicio)} a ${formatarDataPt(bloqueioParaRemover.data_fim)}`}
              </strong>
              ? A viatura volta a ficar disponível nesse período.
            </>
          )
        }
        textoConfirmar="Remover"
        aProcessar={aRemoverBloqueio}
        onConfirmar={() => bloqueioParaRemover && handleRemoverBloqueio(bloqueioParaRemover)}
        onCancelar={() => setBloqueioParaRemover(null)}
      />
    </div>
  );
};

export default ViaturasPage;
