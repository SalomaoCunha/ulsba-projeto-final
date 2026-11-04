import React from 'react';

const AgendaPage: React.FC = () => {
  return (
    <div className="h-100 d-flex flex-column">
      {/* Cabeçalho da Página */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Agenda e Roteiros</h1>
          <p className="text-muted mb-0 small">Planeamento diário de visitas ao domicílio</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-calendar-plus"></i>
          Nova Visita
        </button>
      </div>

      {/* Área Central (Empty State para desenvolvimento futuro) */}
      <div className="card shadow-sm border-0 flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center text-muted p-5">
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
            <i className="bi bi-calendar3" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">Módulo de Agenda em Construção</h5>
          <p className="mb-0 mx-auto" style={{ maxWidth: '400px' }}>
            Esta área será responsável pela visualização do calendário interativo, marcação de visitas e distribuição de rotas pelas equipas de enfermagem.
          </p>
          <button className="btn btn-outline-secondary mt-4 px-4 rounded-pill">
            <i className="bi bi-arrow-left me-2"></i> Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;