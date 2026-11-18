import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Ocorrencia } from '../types/ocorrencia';
import type { VoltaDetalhe, VisitaDetalhe } from '../types/volta';
import { getOcorrencias } from '../services/ocorrenciaService';
import { getVoltaDetalhe } from '../services/voltaService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import { LABEL_ESTADO_VISITA, COR_ESTADO_VISITA } from '../config/estadoVisita';
import EcraCarregamento from '../components/EcraCarregamento';
import MapaPercursoVolta from '../components/MapaPercursoVolta';
import { formatarHora } from '../utils/formatarHora';

interface VisitaComLocal extends VisitaDetalhe {
  paragemOrdem: number;
  localNome: string | null;
  localMorada: string;
}

const VoltaDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volta, setVolta] = useState<VoltaDetalhe | null>(null);
  const [ocorrenciasGerais, setOcorrenciasGerais] = useState<Ocorrencia[]>([]);
  const [ocorrenciasPorVisita, setOcorrenciasPorVisita] = useState<Record<number, Ocorrencia[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [visitaSelecionadaId, setVisitaSelecionadaId] = useState<number | null>(null);

  useEffect(() => {
    getVoltaDetalhe(Number(id))
      .then((dados) => {
        setVolta(dados);
        const primeira = dados.paragens[0]?.visitas[0];
        setVisitaSelecionadaId(primeira ? primeira.visitaId : null);
      })
      .catch((erro) => console.error('Falha ao carregar volta', erro))
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    if (!volta) return;

    const idsDasVisitas = volta.paragens.flatMap((paragem) =>
      paragem.visitas.map((visita) => visita.visitaId),
    );

    getOcorrencias({ voltaId: volta.id })
      .then(setOcorrenciasGerais)
      .catch((erro) => console.error('Falha ao carregar ocorrências da volta:', erro));

    Promise.all(idsDasVisitas.map((visitaId) => getOcorrencias({ visitaId })))
      .then((resultados) => {
        const mapa: Record<number, Ocorrencia[]> = {};
        idsDasVisitas.forEach((visitaId, indice) => {
          mapa[visitaId] = resultados[indice];
        });
        setOcorrenciasPorVisita(mapa);
      })
      .catch((erro) => console.error('Falha ao carregar ocorrências das visitas:', erro));
  }, [volta]);

  if (carregando) {
    return <EcraCarregamento mensagem="A carregar volta..." />;
  }

  if (!volta) {
    return <div>Volta não encontrada.</div>;
  }

  const distanciaMostrada = volta.distanciaRealKm ?? volta.distanciaEstimadaKm;

  const visitas: VisitaComLocal[] = volta.paragens.flatMap((paragem) =>
    paragem.visitas.map((visita) => ({
      ...visita,
      paragemOrdem: paragem.ordem,
      localNome: paragem.localNome,
      localMorada: paragem.localMorada,
    })),
  );

  const visitaSelecionada = visitas.find((v) => v.visitaId === visitaSelecionadaId) ?? null;

  // Legenda de prioridades realmente presentes nesta volta — evita listar
  // cores que não se aplicam a nenhum utente desta volta em particular.
  const legendaPrioridades = Array.from(
    new Map(
      visitas
        .filter((v) => v.urgenciaCor && v.urgenciaDesignacao)
        .map((v) => [v.urgenciaDesignacao, v.urgenciaCor as string]),
    ).entries(),
  );

  return (
    <div className="h-100 d-flex flex-column align-items-center overflow-auto py-2 py-md-3">
      <div className="card shadow border-0 w-100 ulsba-volta-caixa">
        {/* Cabeçalho */}
        <div className="card-header bg-white border-bottom p-3">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="h5 fw-bold text-dark mb-0">
                {volta.designacao ?? `Volta #${volta.id}`}
              </h1>
              <span
                className="badge px-3 py-2 rounded-pill"
                style={{ backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
              >
                {LABEL_ESTADO_VOLTA[volta.estado]}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button className="btn btn-sm btn-outline-secondary d-print-none" onClick={() => window.print()}>
                <i className="bi bi-printer"></i>
                <span className="d-none d-sm-inline"> Imprimir relatório</span>
              </button>
              <button
                className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center d-print-none"
                style={{ width: '32px', height: '32px' }}
                title="Voltar ao calendário"
                onClick={() => navigate('/agenda')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <p className="text-muted small mb-3 text-capitalize">
            {new Date(volta.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="row g-3">
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-people" label="Equipa" valor={volta.equipaCodigo ? `Equipa ${volta.equipaCodigo}` : 'Sem equipa'} />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-truck" label="Viatura" valor={volta.viaturaMatricula ?? 'Sem viatura'} />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-clock" label="Horário previsto" valor={`${formatarHora(volta.partidaPrevista)} → ${formatarHora(volta.regressoPrevisto)}`} />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-signpost-2" label="Distância" valor={distanciaMostrada !== null ? `${distanciaMostrada} km` : '—'} />
            </div>
          </div>
        </div>

        {/* Corpo: 3 colunas no desktop, empilhado em mobile */}
        <div className="card-body p-3">
          <div className="row g-3">
            {/* Coluna 1 — lista de visitas */}
            <div className="col-12 col-lg-4">
              <h6 className="fw-bold small text-uppercase text-muted mb-2">
                Visitas ({visitas.length})
              </h6>
              <div className="d-flex flex-column gap-2 ulsba-volta-coluna-scroll">
                {visitas.map((visita, indice) => (
                  <button
                    key={visita.visitaId}
                    onClick={() => setVisitaSelecionadaId(visita.visitaId)}
                    className={`btn text-start p-2 rounded-3 border ${visita.visitaId === visitaSelecionadaId ? 'border-success bg-success bg-opacity-10' : 'border-light bg-white'}`}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                        style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: visita.urgenciaCor ?? '#6c757d' }}
                      >
                        {indice + 1}
                      </span>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-medium text-dark text-truncate">{visita.utenteNome}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                          {visita.localNome ?? visita.localMorada}
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {formatarHora(visita.inicioPrevisto)} → {formatarHora(visita.fimPrevisto)}
                          </span>
                          <span
                            className="badge rounded-pill"
                            style={{ backgroundColor: COR_ESTADO_VISITA[visita.visitaEstado], fontSize: '0.65rem' }}
                          >
                            {LABEL_ESTADO_VISITA[visita.visitaEstado] ?? visita.visitaEstado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coluna 2 — detalhe da visita selecionada */}
            <div className="col-12 col-lg-4">
              {!visitaSelecionada ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small p-4">
                  Sem visitas para mostrar.
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h6 className="fw-bold text-dark mb-0">{visitaSelecionada.utenteNome}</h6>
                    {visitaSelecionada.urgenciaDesignacao && (
                      <span
                        className="ulsba-pill"
                        style={{ backgroundColor: `${visitaSelecionada.urgenciaCor}22`, color: visitaSelecionada.urgenciaCor ?? undefined }}
                      >
                        {visitaSelecionada.urgenciaDesignacao}
                      </span>
                    )}
                  </div>
                  <p className="text-muted small mb-3">{visitaSelecionada.localNome ?? visitaSelecionada.localMorada}</p>

                  <h6 className="fw-bold small text-uppercase text-muted mb-2">
                    <i className="bi bi-clock me-1"></i> Horários da visita
                  </h6>
                  <table className="table table-sm mb-3">
                    <thead>
                      <tr className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <th></th>
                        <th>Previsto</th>
                        <th>Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>Início</td>
                        <td>{formatarHora(visitaSelecionada.inicioPrevisto)}</td>
                        <td>{formatarHora(visitaSelecionada.inicioReal)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>Fim</td>
                        <td>{formatarHora(visitaSelecionada.fimPrevisto)}</td>
                        <td>{formatarHora(visitaSelecionada.fimReal)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="fw-bold small text-uppercase text-muted mb-2">
                    <i className="bi bi-chat-left-text me-1"></i> Ocorrências da visita
                  </h6>
                  {(ocorrenciasPorVisita[visitaSelecionada.visitaId] ?? []).length === 0 ? (
                    <p className="text-muted small">Sem ocorrências registadas.</p>
                  ) : (
                    (ocorrenciasPorVisita[visitaSelecionada.visitaId] ?? []).map((ocorrencia) => (
                      <div key={ocorrencia.id} className="ulsba-nota mb-2">
                        <p className="small mb-1">{ocorrencia.texto}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                          {ocorrencia.tipoDesignacao} · {ocorrencia.autorNome}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Coluna 3 — mapa + legenda */}
            <div className="col-12 col-lg-4 d-print-none">
              <h6 className="fw-bold small text-uppercase text-muted mb-2">
                <i className="bi bi-map me-1"></i> Mapa do percurso
              </h6>

              {legendaPrioridades.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {legendaPrioridades.map(([designacao, cor]) => (
                    <span key={designacao} className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
                      <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: cor }} />
                      {designacao}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-3 overflow-hidden border">
                <MapaPercursoVolta paragens={volta.paragens} />
              </div>
            </div>
          </div>

          {/* Ocorrências gerais — largura toda */}
          <hr className="my-3" />
          <h6 className="fw-bold small text-uppercase text-muted mb-2">
            <i className="bi bi-exclamation-circle me-1"></i> Ocorrências gerais da volta
          </h6>
          {ocorrenciasGerais.length === 0 ? (
            <p className="text-muted small mb-0">Sem ocorrências registadas.</p>
          ) : (
            <div className="row g-2">
              {ocorrenciasGerais.map((ocorrencia) => (
                <div key={ocorrencia.id} className="col-12 col-md-6">
                  <div className="ulsba-nota h-100">
                    <p className="small mb-1">{ocorrencia.texto}</p>
                    <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                      {ocorrencia.tipoDesignacao} · {ocorrencia.autorNome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="card-footer bg-white d-print-none p-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/agenda')}>
            <i className="bi bi-arrow-left"></i> Voltar ao calendário
          </button>
        </div>
      </div>
    </div>
  );
};

const DetalheItem = ({ icon, label, valor }: { icon: string; label: string; valor: string }) => (
  <div className="d-flex align-items-center gap-2">
    <div
      className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: '32px', height: '32px' }}
    >
      <i className={`bi ${icon}`}></i>
    </div>
    <div style={{ minWidth: 0 }}>
      <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>{label}</p>
      <p className="fw-medium text-dark mb-0 text-truncate" style={{ fontSize: '0.85rem' }}>{valor}</p>
    </div>
  </div>
);

export default VoltaDetalhePage;
