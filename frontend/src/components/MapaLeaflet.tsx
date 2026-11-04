import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Utente } from '../types/utente'
import { NIVEIS_PRIORIDADE, getNivelPrioridade } from '@/config/niveis';

// O mapa vive numa grelha flexível (altura calculada em runtime); sem isto,
// o Leaflet mede o contentor antes do layout estabilizar e fica com o
// tamanho errado (tiles cortados/"a sair da caixa").
const AjustarTamanhoMapa: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
};

interface Props {
  utentes: Utente[];
  filtroAtivo?: string | null;
}

const criarIconePersonalizado = (prioridade: string) => {
  const cor = getNivelPrioridade(prioridade)?.corDot;

  const svgIcon = `
    <div style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.4));">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
        <path stroke="white" stroke-width="0.5" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-pin-container',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const MapaLeaflet: React.FC<Props> = ({ utentes, filtroAtivo }) => {
  const center: [number, number] = [38.015, -7.863];

  // A magia acontece aqui: Filtramos os pinos se houver um botão clicado!
  const pinosVisiveis = filtroAtivo
    ? utentes.filter(ut => ut.prioridade === filtroAtivo)
    : utentes;

  return (
    <div className="card shadow-sm border-0 h-100 overflow-hidden position-relative" style={{ maxHeight: '100%' }}>
      <div className="position-absolute bg-white p-3 rounded shadow-sm border" style={{ top: '20px', left: '20px', zIndex: 1000, width: '180px', opacity: 0.95 }}>
        <h6 className="fw-bold text-dark mb-3 small">Legenda</h6>
        <div className="d-flex flex-column gap-2 small mb-3">
          {NIVEIS_PRIORIDADE.map(nivel => (
            <div key={nivel.valor} className="d-flex align-items-center gap-2">
              <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: nivel.corDot }}></span>
              <span className="text-muted">{nivel.label}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
          <i className="bi bi-funnel"></i> Filtrar Utentes
        </button>
      </div>

      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <AjustarTamanhoMapa />

        {/* Renderiza apenas os pinos que passaram no filtro */}
        {pinosVisiveis.map((ut) => (
          <Marker key={ut.id} position={[ut.lat, ut.lng]} icon={criarIconePersonalizado(ut.prioridade)}>
            <Popup><strong>Utente:</strong> {ut.nome}<br />Prioridade: {ut.prioridade}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaLeaflet;