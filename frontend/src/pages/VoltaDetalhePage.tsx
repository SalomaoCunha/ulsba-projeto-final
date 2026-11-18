import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getVoltaDetalhe } from '../services/voltaService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import type { VoltaDetalhe } from '../types/volta';
import EcraCarregamento from '../components/EcraCarregamento';
import { formatarHora } from '../utils/formatarHora';

const VoltaDetalhePage = () => {
  const { id } = useParams();
  const [volta, setVolta] = useState<VoltaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getVoltaDetalhe(Number(id))
      .then(setVolta)
      .catch((erro) => console.error('Falha ao carregar volta', erro))
      .finally(() => setCarregando(false))
  }, [id]);

  if (carregando) {
    return <EcraCarregamento mensagem="A carregar volta..." />;
  }

  if (!volta) {
    return <div>Volta não encontrada.</div>;
  }

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">
            {volta.designacao ?? `Volta #${volta.id}`}
          </h1>
          <p className="text-muted mb-0 small">
            {volta.equipaCodigo ? `Equipa ${volta.equipaCodigo}` : 'Sem equipa'}
            {' · '}
            {volta.viaturaMatricula ?? 'Sem viatura'}
            {' · '}
            {formatarHora(volta.partidaPrevista)} → {formatarHora(volta.regressoPrevisto)}
          </p>
        </div>
        <span
          className="badge px-3 py-2"
          style={{ backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
        >
          {LABEL_ESTADO_VOLTA[volta.estado]}
        </span>
      </div>

      

      {volta.paragens.map((paragem) => (
        <div key={paragem.ordem}>
          <div>{paragem.localNome ?? paragem.localMorada}</div>

          {paragem.visitas.map((visita) => (
            <div key={visita.visitaId}>
              {visita.utenteNome} — {formatarHora(visita.inicioPrevisto)} → {formatarHora(visita.fimPrevisto)} ({visita.visitaEstado})
            </div>
          ))}
        </div>
      ))}

      {/* Para já fica de fora: ocorrências, mapa, imprimir — isso é a Parte C */}
    </div>
  );
};

export default VoltaDetalhePage;
