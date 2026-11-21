import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  getViaturas,
  createViatura,
  updateViatura,
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

const calcularProximaRevisao = (viatura: Viatura) => {
  if (!viatura.data_ultima_revisao || !viatura.periodicidade_revisao_meses) {
    return '—';
  }
  const data = new Date(viatura.data_ultima_revisao);
  data.setMonth(data.getMonth() + viatura.periodicidade_revisao_meses);
  return data.toLocaleDateString('pt-PT');
};

const formatarDataPt = (dataIso: string) => {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
};

const formatarDataParaInput = (dataStr?: string | null) => {
  if (!dataStr) return '';
  return dataStr.slice(0, 10);
};

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

  // Modal de bloqueios por dia (impedimentos)
  const [viaturaBloqueiosModal, setViaturaBloqueiosModal] = useState<Viatura | null>(null);
  const hojeIso = format(new Date(), 'yyyy-MM-dd');
  const [novoBloqueioInicio, setNovoBloqueioInicio] = useState(hojeIso);
  const [novoBloqueioFim, setNovoBloqueioFim] = useState(hojeIso);
  const [novoBloqueioTipo, setNovoBloqueioTipo] = useState<TipoBloqueioViatura>('MANUTENCAO');
  const [novoBloqueioMotivo, setNovoBloqueioMotivo] = useState('');
  const [erroBloqueio, setErroBloqueio] = useState<string | null>(null);
  const [aGuardarBloqueio, setAGuardarBloqueio] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    comAtrasoMinimo(
      Promise.allSettled([
        getViaturas().then(setViaturas),
        getBloqueiosViaturas().then(setBloqueios),
        getEquipas().then(setEquipas),
      ]),
    ).finally(() => setCarregando(false));
  }, []);

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

  const contarBloqueiosFuturos = (viaturaId: number) =>
    bloqueios.filter((b) => b.viatura_id === viaturaId && b.data_fim >= hojeIso).length;

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

  const abrirModalEdicao = (viatura: Viatura) => {
    setModoCriacao(false);
    setViaturaEmEdicao({ ...viatura });
  };

  const fecharModalEdicao = () => {
    setViaturaEmEdicao(null);
    setModoCriacao(false);
  };

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

  const handleRemoverBloqueio = async (bloqueioId: number) => {
    await removerBloqueioViatura(bloqueioId);
    setBloqueios((prev) => prev.filter((b) => b.id !== bloqueioId));
  };

  const viaturasFiltradas =
    filtroEstado === 'TODAS' ? viaturas : viaturas.filter((v) => v.estado === filtroEstado);

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

      {/* Cartão Branco Principal */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden ulsba-table-card-shell">
        {/* Lista em cartões — só em mobile (<md) */}
        <div className="d-md-none">
          {viaturasFiltradas.map((viatura) => {
            const bloqueadaHoje = viaturaBloqueadaNoDia(bloqueios, viatura.id, hojeIso);
            const totalBloqueios = contarBloqueiosFuturos(viatura.id);
            return (
              <div key={viatura.id} className="d-flex align-items-center gap-2 p-3 border-bottom">
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="fw-medium text-dark text-truncate">
                    {viatura.matricula} — {viatura.designacao ?? 'Sem modelo'}
                  </div>
                  <div className="text-muted small mt-1">
                    {LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao}
                    {viatura.capacidade_deposito ? ` (${viatura.capacidade_deposito})` : ''} ·{' '}
                    {viatura.autonomia ?? '—'}{' '}
                    {viatura.unidade_autonomia === 'KM'
                      ? 'km'
                      : viatura.unidade_autonomia === 'PERCENTAGEM'
                        ? '%'
                        : ''}{' '}
                    · {viatura.lugares} lug.
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                    {getBadgeEstado(viatura.estado)}
                    {bloqueadaHoje && (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">
                        Bloqueada hoje
                      </span>
                    )}
                    {viatura.equipa_codigo ? (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none text-success small fw-medium"
                        onClick={() => navigate('/equipas')}
                      >
                        {nomeDaEquipa(viatura.equipa_codigo)}
                      </button>
                    ) : (
                      <span className="text-muted small">Sem equipa</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0 position-relative"
                  title="Bloqueios / impedimentos por dia"
                  onClick={() => abrirModalBloqueios(viatura)}
                >
                  <i className="bi bi-calendar-x"></i>
                  {totalBloqueios > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {totalBloqueios}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0"
                  title="Agendar no calendário"
                  onClick={() => navigate(`/agenda?viaturaId=${viatura.id}`)}
                >
                  <i className="bi bi-calendar3"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0"
                  title="Editar viatura"
                  onClick={() => abrirModalEdicao(viatura)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>
            );
          })}
        </div>

        {/* Tabela de Dados — a partir de md */}
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
              {viaturasFiltradas.map((viatura) => {
                const bloqueadaHoje = viaturaBloqueadaNoDia(bloqueios, viatura.id, hojeIso);
                const totalBloqueios = contarBloqueiosFuturos(viatura.id);

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
                        className="btn btn-sm btn-light text-secondary shadow-sm border"
                        title="Editar viatura"
                        onClick={() => abrirModalEdicao(viatura)}
                      >
                        <i className="bi bi-pencil"></i>
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
                          onClick={() => handleRemoverBloqueio(bloq.id)}
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
    </div>
  );
};

export default ViaturasPage;