import React from 'react';
import MapaLeaflet from '../components/MapaLeaflet';

const MapaPage: React.FC = () => {
  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Mapa de Utentes</h1>
          <p className="text-muted mb-0 small">Distribuição geográfica dos utentes por prioridade de atendimento</p>
        </div>
      </div>

      <div className="flex-grow-1">
        <MapaLeaflet />
      </div>
    </div>
  );
};

export default MapaPage;
