import React from 'react';
import MapaLeaflet from '../components/MapaLeaflet';
import { useEffect, useState } from 'react'
import { getUtentes } from '../services/utenteService'
import type { Utente } from '../types/utente'
import FiltrosUtentesPainel from '../components/FiltrosUtentesPainel';
import EcraCarregamento from '../components/EcraCarregamento';
import { filtrarUtentes, filtrosVazios, type FiltrosUtentes } from '../utils/filtrosUtentes';

const MapaPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [filtros, setFiltros] = useState<FiltrosUtentes>(filtrosVazios);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { getUtentes().then(setUtentes).finally(() => setCarregando(false)); }, []);

  const utentesFiltrados = filtrarUtentes(utentes, filtros);

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Mapa de Utentes</h1>
          <p className="text-muted mb-0 small">Distribuição geográfica dos utentes por prioridade de atendimento</p>
        </div>
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => setFiltrosAbertos(!filtrosAbertos)}>
          <i className="bi bi-funnel"></i> Filtros
        </button>
      </div>

      {filtrosAbertos && (
        <div className="card shadow-sm border-0 bg-white mb-3">
          <FiltrosUtentesPainel utentes={utentes} filtros={filtros} onChange={setFiltros} />
        </div>
      )}

      <div className="flex-grow-1">
        <MapaLeaflet utentes={utentesFiltrados} />
      </div>
    </div>
  );
};

export default MapaPage;
