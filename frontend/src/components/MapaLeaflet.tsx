import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Função para gerar um ícone personalizado com base na prioridade do utente
// Função para gerar um ícone personalizado (Formato Balão/Pino) com base na prioridade do utente
const criarIconePersonalizado = (prioridade: string) => {
  let cor = '#6c757d'; // Cinzento por defeito

  switch (prioridade) {
    case 'Urgente 0 dias': cor = '#dc3545'; break; // Vermelho
    case 'Urgente 1 dia': cor = '#fd7e14'; break; // Laranja
    case 'Urgente 2 dias': cor = '#ffc107'; break; // Amarelo
    case 'Não urgente 1': cor = '#ffda6a'; break; // Amarelo Claro
    case 'Não urgente 2': cor = '#20c997'; break; // Verde
  }

  // Desenhamos um pino SVG vetorial em vez de uma simples div circular
  const svgIcon = `
    <div style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.4));">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
        <path stroke="white" stroke-width="0.5" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-pin-container', // Limpamos a classe para não criar fundos brancos extra
    iconSize: [32, 32],
    iconAnchor: [16, 32], // O ponto de âncora é a ponta inferior do pino (meio, baixo)
    popupAnchor: [0, -32] // O popup abre logo acima do balão
  });
};

const MapaLeaflet: React.FC = () => {
  const center: [number, number] = [38.015, -7.863];

  // Dados de teste para simular vários pinos de cores diferentes no mapa
  const utentesMapa = [
    { nome: 'Maria Teresa Almeida', coords: [38.015, -7.863] as [number, number], prioridade: 'Urgente 0 dias' },
    { nome: 'João Pedro Silva', coords: [38.012, -7.867] as [number, number], prioridade: 'Urgente 1 dia' },
    { nome: 'António Ferreira', coords: [38.018, -7.859] as [number, number], prioridade: 'Urgente 2 dias' },
    { nome: 'Francisca Santos', coords: [38.009, -7.861] as [number, number], prioridade: 'Não urgente 1' },
    { nome: 'Carlos Ribeiro', coords: [38.021, -7.865] as [number, number], prioridade: 'Não urgente 2' },
  ];

  return (
    <div className="card shadow-sm border-0 h-100 overflow-hidden position-relative">
      
      {/* Legenda Flutuante */}
      <div 
        className="position-absolute bg-white p-3 rounded shadow-sm border" 
        style={{ 
          top: '20px', 
          left: '20px', 
          zIndex: 1000,
          width: '180px',
          opacity: 0.95
        }}
      >
        <h6 className="fw-bold text-dark mb-3 small">Legenda</h6>
        <div className="d-flex flex-column gap-2 small mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-danger" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-muted">Urgente 0 dias</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#fd7e14' }}></span>
            <span className="text-muted">Urgente 1 dia</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-warning" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-muted">Urgente 2 dias</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ffda6a' }}></span>
            <span className="text-muted">Não urgente 1</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-success" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-muted">Não urgente 2</span>
          </div>
        </div>
        
        <button className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
          <i className="bi bi-funnel"></i> Filtrar Utentes
        </button>
      </div>

      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        
        {/* Renderiza dinamicamente os pinos de teste com cores correspondentes */}
        {utentesMapa.map((ut, index) => (
          <Marker 
            key={index} 
            position={ut.coords} 
            icon={criarIconePersonalizado(ut.prioridade)}
          >
            <Popup>
              <strong>Utente:</strong> {ut.nome}<br />
              Prioridade: {ut.prioridade}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaLeaflet;