import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { Utente } from '../types/utente';
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

const CapturarCliqueMapa: React.FC<{
  ativo: boolean;
  onClique?: (lat: number, lng: number) => void;
}> = ({ ativo, onClique }) => {
  useMapEvents({
    click(e) {
      if (ativo && onClique) {
        onClique(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    },
  });

  return null;
};

const CentrarEmPonto: React.FC<{ ponto?: { lat: number; lng: number } | null }> = ({ ponto }) => {
  const map = useMap();

  useEffect(() => {
    if (ponto && (ponto.lat !== 0 || ponto.lng !== 0)) {
      if (ponto.lat >= -90 && ponto.lat <= 90 && ponto.lng >= -180 && ponto.lng <= 180) {
        map.panTo([ponto.lat, ponto.lng], { animate: true });
      }
    }
  }, [ponto, map]);

  return null;
};

interface Props {
  utentes: Utente[];
  filtroAtivo?: string | null;
  modoEdicao?: boolean;
  pontoEdicao?: { lat: number; lng: number } | null;
  pontoEdicaoValido?: boolean;
  // Distingue um ponto só pré-preenchido (p.ex. o centro de Beja por omissão
  // ao criar um novo local) de um ponto que o utilizador já clicou/arrastou
  // de propósito. Sem isto, o pino por omissão fica com o mesmo azul "válido"
  // de um pino confirmado, e o utilizador avança sem perceber que ainda tem
  // de marcar a localização real. Omitido (ou true) preserva o comportamento
  // de correção de coordenadas já existentes, onde o ponto de partida já é
  // uma coordenada real do utente.
  pontoEdicaoConfirmado?: boolean;
  mostrarLegenda?: boolean;
  onSelecionarPonto?: (lat: number, lng: number) => void;
  onIniciarEdicaoUtente?: (utente: Utente) => void;
  onToggleFiltros?: () => void;
}

const criarIconePersonalizado = (prioridade: string) => {
  const cor = getNivelPrioridade(prioridade)?.corDot ?? '#6c757d';

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
    popupAnchor: [0, -32],
  });
};

type EstadoPinoEdicao = 'pendente' | 'valido' | 'invalido';

const criarIconeEdicao = (estado: EstadoPinoEdicao) => {
  const cor = estado === 'valido' ? '#0d6efd' : estado === 'invalido' ? '#dc3545' : '#adb5bd';
  const tracejado = estado === 'pendente' ? 'stroke-dasharray="1.5,1.2"' : '';

  const svgIcon = `
    <div style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); opacity: ${estado === 'pendente' ? 0.6 : 1};">
      <svg width="38" height="38" viewBox="0 0 16 16" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
        <path stroke="white" stroke-width="0.8" ${tracejado} d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-pin-container',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

const MapaLeaflet: React.FC<Props> = ({
  utentes,
  filtroAtivo,
  modoEdicao = false,
  pontoEdicao = null,
  pontoEdicaoValido = true,
  pontoEdicaoConfirmado = true,
  mostrarLegenda = true,
  onSelecionarPonto,
  onIniciarEdicaoUtente,
  onToggleFiltros,
}) => {
  const center: [number, number] = [38.015, -7.863];

  // Filtra por prioridade (se ativo) e ignora registos sem coordenadas
  const pinosVisiveis = (
    filtroAtivo ? utentes.filter((ut) => ut.prioridade === filtroAtivo) : utentes
  ).filter((ut): ut is Utente & { lat: number; lng: number } => ut.lat !== null && ut.lng !== null);

  const pontoEdicaoDesenhavel =
    pontoEdicao &&
    !Number.isNaN(pontoEdicao.lat) &&
    !Number.isNaN(pontoEdicao.lng) &&
    pontoEdicao.lat >= -90 &&
    pontoEdicao.lat <= 90 &&
    pontoEdicao.lng >= -180 &&
    pontoEdicao.lng <= 180;

  const estadoPinoEdicao: EstadoPinoEdicao = !pontoEdicaoConfirmado
    ? 'pendente'
    : pontoEdicaoValido
      ? 'valido'
      : 'invalido';

  return (
    <div
      className="card shadow-sm border-0 h-100 overflow-hidden position-relative"
      style={{ maxHeight: '100%', minHeight: '420px' }}
    >
      {mostrarLegenda && (
        <div
          className="position-absolute bg-white p-3 rounded shadow-sm border d-none d-sm-block"
          style={{ top: '16px', left: '16px', zIndex: 1000, width: '185px', opacity: 0.95 }}
        >
          <h6 className="fw-bold text-dark mb-2 small">Legenda</h6>
          <div className="d-flex flex-column gap-2 small mb-2">
            {NIVEIS_PRIORIDADE.map((nivel) => (
              <div key={nivel.valor} className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle flex-shrink-0"
                  style={{ width: '12px', height: '12px', backgroundColor: nivel.corDot }}
                ></span>
                <span className="text-muted">{nivel.label}</span>
              </div>
            ))}
          </div>
          {onToggleFiltros && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
              onClick={onToggleFiltros}
            >
              <i className="bi bi-funnel"></i> Filtrar Utentes
            </button>
          )}
        </div>
      )}

      {/* Aviso flutuante quando está em modo de marcação */}
      {modoEdicao && (
        <div
          className="position-absolute start-50 translate-middle-x bg-primary text-white px-3 py-2 rounded-pill shadow small fw-medium text-center"
          style={{ top: '16px', zIndex: 1000 }}
        >
          <i className="bi bi-crosshair me-2"></i>
          Clique no mapa ou arraste o pino para definir as coordenadas
        </div>
      )}

      <MapContainer
        center={center}
        zoom={12}
        style={{
          height: '100%',
          width: '100%',
          cursor: modoEdicao ? 'crosshair' : 'grab',
        }}
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <AjustarTamanhoMapa />
        <CapturarCliqueMapa ativo={modoEdicao} onClique={onSelecionarPonto} />
        <CentrarEmPonto ponto={pontoEdicaoDesenhavel ? pontoEdicao : null} />

        {/* Marcadores dos utentes */}
        {pinosVisiveis.map((ut) => (
          <Marker
            key={ut.id}
            position={[ut.lat, ut.lng]}
            icon={criarIconePersonalizado(ut.prioridade)}
          >
            <Popup>
              <div className="small">
                <div className="fw-bold text-dark">{ut.nome}</div>
                <div className="text-muted">N.º {ut.numeroUtente}</div>
                <div className="mt-1">
                  <strong>Prioridade:</strong> {ut.prioridade || 'Sem avaliação'}
                </div>
                {ut.ruaNumero && (
                  <div>
                    <strong>Morada:</strong> {ut.ruaNumero}
                    {ut.localidade ? `, ${ut.localidade}` : ''}
                  </div>
                )}
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  {ut.lat.toFixed(5)}, {ut.lng.toFixed(5)}
                </div>
                {onIniciarEdicaoUtente && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary w-100 mt-2"
                    onClick={() => onIniciarEdicaoUtente(ut)}
                  >
                    <i className="bi bi-geo-alt-fill me-1"></i>
                    Corrigir coordenadas
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcador temporário de pré-visualização (arrastável) durante a edição */}
        {modoEdicao && pontoEdicaoDesenhavel && (
          <Marker
            position={[pontoEdicao.lat, pontoEdicao.lng]}
            icon={criarIconeEdicao(estadoPinoEdicao)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onSelecionarPonto?.(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
              },
            }}
          >
            <Popup>
              <div className="small">
                <strong>
                  {estadoPinoEdicao === 'pendente' ? 'Posição por confirmar' : 'Nova posição selecionada'}
                </strong>
                <br />
                Lat: {pontoEdicao.lat.toFixed(6)}
                <br />
                Lng: {pontoEdicao.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapaLeaflet;