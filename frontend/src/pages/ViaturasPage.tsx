import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getViaturas, createViatura, updateViatura } from '../services/viaturaService';
import type {
  Viatura,
  EstadoViatura,
  TipoMotorizacao,
  UnidadeAutonomia,
} from '../types/viatura';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';

const LABEL_MOTORIZACAO: Record<string, string> = {
  GASOLINA: 'Gasolina',
  GASOLEO: 'Gasóleo',
  HIBRIDO: 'Híbrido',
  ELETRICO: 'Elétrico',
  OUTRO: 'Outro',
};

const LABEL_ESTADO: Record<EstadoViatura, string> = {
  OPERACIONAL: 'Ativa',
  EM_MANUTENCAO: 'Em manutenção',
  INATIVA: 'Inativa',
};

const calcularProximaRevisao = (viatura: Viatura) => {
  if (!viatura.data_ultima_revisao || !viatura.periodicidade_revisao_meses) {
    return '—';
  }
  const data = new Date(viatura.data_ultima_revisao);
  data.setMonth(data.getMonth() + viatura.periodicidade_revisao_meses);
  return data.toLocaleDateString('pt-PT');
};

const formatarDataParaInput = (dataStr?: string | null) => {
  if (!dataStr) return '';
  return dataStr.slice(0, 10);
};

const ViaturasPage: React.FC = () => {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [viaturaEmEdicao, setViaturaEmEdicao] = useState<Viatura | null>(null);
  const [modoCriacao, setModoCriacao] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    comAtrasoMinimo(getViaturas())
      .then(setViaturas)
      .catch((erro) => console.error('Falha ao carregar viaturas:', erro))
      .finally(() => setCarregando(false));
  }, []);

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

  const abrirModalNova = () => {
    setModoCriacao(true);
    setViaturaEmEdicao({
      id: 0,
      matricula: '',
      designacao: '',
      tipo_motorizacao: 'GASOLEO',
      autonomia: 600,
      unidade_autonomia: 'KM',
      lugares: 5,
      equipa_codigo: null,
      data_ultima_revisao: null,
      periodicidade_revisao_meses: 12,
      estado: 'OPERACIONAL',
    } as Viatura);
  };

  const abrirModalEdicao = (viatura: Viatura) => {
    setModoCriacao(false);
    setViaturaEmEdicao({ ...viatura });
  };

  const fecharModal = () => {
    setViaturaEmEdicao(null);
    setModoCriacao(false);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viaturaEmEdicao) return;
    setAGuardar(true);

    try {
      if (modoCriacao) {
        const { id: _id, ...payload } = viaturaEmEdicao;
        try {
          const criada = await createViatura(payload);
          setViaturas((prev) => [...prev, criada]);
        } catch (erro) {
          console.warn('API indisponível para criar viatura; a atualizar localmente:', erro);
          const localNova = { ...viaturaEmEdicao, id: Date.now() };
          setViaturas((prev) => [...prev, localNova]);
        }
      } else {
        try {
          const atualizada = await updateViatura(viaturaEmEdicao);
          setViaturas((prev) => prev.map((v) => (v.id === atualizada.id ? atualizada : v)));
        } catch (erro) {
          console.warn('API indisponível para editar viatura; a atualizar localmente:', erro);
          setViaturas((prev) =>
            prev.map((v) => (v.id === viaturaEmEdicao.id ? viaturaEmEdicao : v))
          );
        }
      }
      fecharModal();
    } finally {
      setAGuardar(false);
    }
  };

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Viaturas</h1>
          <p className="text-muted mb-0 small">Gestão de viaturas, estado e disponibilidade</p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={abrirModalNova}
        >
          <i className="bi bi-plus-lg"></i>
          Nova Viatura
        </button>
      </div>

      {/* Cartão Branco Principal */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden ulsba-table-card-shell">
        {/* Lista em cartões — só em mobile (<md) */}
        <div className="d-md-none">
          {viaturas.map((viatura) => (
            <div key={viatura.id} className="d-flex align-items-center gap-2 p-3 border-bottom">
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-medium text-dark text-truncate">
                  {viatura.matricula} — {viatura.designacao ?? 'Sem designação'}
                </div>
                <div className="text-muted small mt-1">
                  {LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao} ·{' '}
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
                className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0"
                title="Agendar no calendário"
                onClick={() => navigate(`/agenda?viaturaId=${viatura.id}`)}
              >
                <i className="bi bi-calendar3"></i>
              </button>
              <button
                className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0"
                title="Editar viatura"
                onClick={() => abrirModalEdicao(viatura)}
              >
                <i className="bi bi-pencil"></i>
              </button>
            </div>
          ))}
        </div>

        {/* Tabela de Dados — a partir de md */}
        <div className="table-responsive flex-grow-1 d-none d-md-block">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">Matrícula</th>
                <th className="fw-medium border-bottom-0 py-3">Modelo</th>
                <th className="fw-medium border-bottom-0 py-3">Combustível</th>
                <th className="fw-medium border-bottom-0 py-3">Autonomia</th>
                <th className="fw-medium border-bottom-0 py-3">Lugares</th>
                <th className="fw-medium border-bottom-0 py-3">Equipa</th>
                <th className="fw-medium border-bottom-0 py-3">Próxima Revisão</th>
                <th className="fw-medium border-bottom-0 py-3">Estado</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="ps-4 py-3 fw-medium text-dark">{viatura.matricula}</td>
                  <td className="py-3 text-muted">{viatura.designacao ?? 'Sem designação'}</td>
                  <td className="py-3 text-muted">
                    {LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao}
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
                  <td className="py-3">{getBadgeEstado(viatura.estado)}</td>
                  <td className="pe-4 py-3 text-end text-nowrap">
                    <button
                      className="btn btn-sm btn-light text-secondary shadow-sm border me-1"
                      title="Agendar no calendário"
                      onClick={() => navigate(`/agenda?viaturaId=${viatura.id}`)}
                    >
                      <i className="bi bi-calendar3"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-light text-secondary shadow-sm border"
                      title="Editar viatura"
                      onClick={() => abrirModalEdicao(viatura)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {viaturaEmEdicao && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleGuardar}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {modoCriacao ? 'Nova Viatura' : `Editar Viatura — ${viaturaEmEdicao.matricula}`}
                  </h5>
                  <button type="button" className="btn-close" onClick={fecharModal}></button>
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

                    <div className="col-12 col-md-4">
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
                        {Object.entries(LABEL_MOTORIZACAO).map(([chave, label]) => (
                          <option key={chave} value={chave}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
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

                    <div className="col-6 col-md-4">
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
                        <option value="A">Equipa A</option>
                        <option value="B">Equipa B</option>
                        <option value="C">Equipa C</option>
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
                        <option value="EM_MANUTENCAO">Em manutenção</option>
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
                  <button type="button" className="btn btn-light border" onClick={fecharModal}>
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
    </div>
  );
};

export default ViaturasPage;