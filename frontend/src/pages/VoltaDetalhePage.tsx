import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Ocorrencia } from '../types/ocorrencia';
import type { VoltaDetalhe } from '../types/volta';
import { getOcorrencias } from '../services/ocorrenciaService'
import { getVoltaDetalhe } from '../services/voltaService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import { LABEL_ESTADO_VISITA, COR_ESTADO_VISITA } from '../config/estadoVisita';
import EcraCarregamento from '../components/EcraCarregamento';
import MapaPercursoVolta from '../components/MapaPercursoVolta';
import { formatarHora } from '../utils/formatarHora';
import { useNavigate } from 'react-router-dom';

const VoltaDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volta, setVolta] = useState<VoltaDetalhe | null>(null);
  const [ocorrenciasGerais, setOcorrenciasGerais] = useState<Ocorrencia[]>([]);
  const [ocorrenciasPorVisita, setOcorrenciasPorVisita] = useState<Record<number, Ocorrencia[]>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getVoltaDetalhe(Number(id))
      .then(setVolta)
      .catch((erro) => console.error('Falha ao carregar volta', erro))
      .finally(() => setCarregando(false))
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
  const totalVisitas = volta.paragens.reduce((total, p) => total + p.visitas.length, 0);

  return (
    <div className="h-100 d-flex flex-column">
      {/* Cabeçalho */}
      <div className="card shadow-sm border-0 p-3 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <button
              className="btn btn-sm btn-link text-muted text-decoration-none ps-0 mb-1 d-print-none"
              onClick={() => navigate('/agenda')}
            >
              <i className="bi bi-arrow-left"></i> Voltar ao calendário
            </button>
            <h1 className="h4 fw-bold text-dark mb-1">
              {volta.designacao ?? `Volta #${volta.id}`}
            </h1>
            <p className="text-muted mb-0 small">
              {new Date(volta.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className="badge px-3 py-2 rounded-pill"
              style={{ backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
            >
              {LABEL_ESTADO_VOLTA[volta.estado]}
            </span>
            <button className="btn btn-sm btn-outline-secondary d-print-none" onClick={() => window.print()}>
              <i className="bi bi-printer"></i> Imprimir relatório
            </button>
          </div>
        </div>

        <hr className="my-3" />

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

      {/* Mapa */}
      <div className="card shadow-sm border-0 mb-3 overflow-hidden d-print-none">
        <div className="card-header bg-white border-bottom d-flex align-items-center gap-2 py-2">
          <i className="bi bi-map text-success"></i>
          <h6 className="fw-bold mb-0">Mapa do percurso</h6>
        </div>
        <MapaPercursoVolta paragens={volta.paragens} />
      </div>

      {/* Visitas */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white border-bottom d-flex align-items-center gap-2 py-2">
          <i className="bi bi-list-check text-success"></i>
          <h6 className="fw-bold mb-0">Visitas</h6>
          <span className="text-muted small">({totalVisitas})</span>
        </div>

        <div className="card-body p-3">
          {volta.paragens.map((paragem) => (
            <div key={paragem.ordem} className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                <i className="bi bi-geo-alt"></i>
                <span className="fw-medium text-dark">{paragem.localNome ?? paragem.localMorada}</span>
              </div>

              {paragem.visitas.map((visita) => (
                <div key={visita.visitaId} className="d-flex align-items-start gap-3 ps-4 py-2 border-bottom border-light">
                  <div
                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                  >
                    <i className="bi bi-person-fill"></i>
                  </div>

                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="fw-medium text-dark">{visita.utenteNome}</span>
                      <span
                        className="badge rounded-pill"
                        style={{ backgroundColor: COR_ESTADO_VISITA[visita.visitaEstado] }}
                      >
                        {LABEL_ESTADO_VISITA[visita.visitaEstado] ?? visita.visitaEstado}
                      </span>
                    </div>
                    <p className="text-muted small mb-0">
                      {formatarHora(visita.inicioPrevisto)} → {formatarHora(visita.fimPrevisto)}
                    </p>

                    {(ocorrenciasPorVisita[visita.visitaId] ?? []).map((ocorrencia) => (
                      <div key={ocorrencia.id} className="d-flex align-items-start gap-2 mt-1">
                        <i className="bi bi-chat-left-text text-warning small mt-1"></i>
                        <p className="small text-muted mb-0">
                          <span className="fw-medium">{ocorrencia.tipoDesignacao}:</span> {ocorrencia.texto}
                          <span className="fst-italic"> — {ocorrencia.autorNome}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ocorrências gerais */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white border-bottom d-flex align-items-center gap-2 py-2">
          <i className="bi bi-exclamation-circle text-success"></i>
          <h6 className="fw-bold mb-0">Ocorrências gerais da volta</h6>
        </div>

        <div className="card-body p-3">
          {ocorrenciasGerais.length === 0 ? (
            <p className="text-muted small mb-0">Sem ocorrências registadas.</p>
          ) : (
            ocorrenciasGerais.map((ocorrencia) => (
              <div key={ocorrencia.id} className="d-flex align-items-start gap-2 mb-2">
                <i className="bi bi-chat-left-text text-warning small mt-1"></i>
                <p className="small text-muted mb-0">
                  <span className="fw-medium">{ocorrencia.tipoDesignacao}:</span> {ocorrencia.texto}
                  <span className="fst-italic"> — {ocorrencia.autorNome}</span>
                </p>
              </div>
            ))
          )}
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
