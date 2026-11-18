import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { ParagemDetalhe } from '../types/volta';

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
  paragens: ParagemDetalhe[];
}

const criarIconeNumerado = (numero: number, cor: string) => {
  const svgIcon = `
    <div style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.4)); position: relative;">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
        <path stroke="white" stroke-width="0.5" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
      <span style="position: absolute; top: 2px; left: 0; width: 32px; text-align: center; color: white; font-size: 11px; font-weight: bold;">${numero}</span>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-pin-container',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Quando uma paragem junta várias visitas (mesmo local), usa a cor da
// urgência mais prioritária entre elas para o pino — nunca a menos urgente.
const corDaParagem = (paragem: ParagemDetalhe) => {
  const comCor = paragem.visitas.filter((v) => v.urgenciaCor !== null);
  return comCor[0]?.urgenciaCor ?? '#0d6efd';
};

const MapaPercursoVolta: React.FC<Props> = ({ paragens }) => {
  const paragensComCoordenadas = paragens.filter(
    (p): p is ParagemDetalhe & { lat: number; lng: number } => p.lat !== null && p.lng !== null,
  );

  if (paragensComCoordenadas.length === 0) {
    return (
      <div className="card shadow-sm border-0 p-3 text-muted small">
        Sem coordenadas para mostrar o percurso.
      </div>
    );
  }

  const center: [number, number] = [paragensComCoordenadas[0].lat, paragensComCoordenadas[0].lng];
  const pontos: [number, number][] = paragensComCoordenadas.map((p) => [p.lat, p.lng]);

  return (
    <div className="position-relative" style={{ height: '320px' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <AjustarTamanhoMapa />

        {paragensComCoordenadas.map((paragem) => (
          <Marker
            key={paragem.ordem}
            position={[paragem.lat, paragem.lng]}
            icon={criarIconeNumerado(paragem.ordem, corDaParagem(paragem))}
          >
            <Popup>
              <strong>{paragem.localNome ?? paragem.localMorada}</strong>
              {paragem.visitas.map((v) => (
                <div key={v.visitaId}>{v.utenteNome}</div>
              ))}
            </Popup>
          </Marker>
        ))}

        <Polyline positions={pontos} color="#0d6efd" dashArray="6 6" />
      </MapContainer>
    </div>
  );
};

export default MapaPercursoVolta;
