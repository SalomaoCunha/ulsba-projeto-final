import React from 'react';

const VisitasPage: React.FC = () => {
  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Visitas</h1>
          <p className="text-muted mb-0 small">Módulo em desenvolvimento</p>
        </div>
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center text-muted p-5">
          <i className="bi bi-tools text-secondary mb-3" style={{ fontSize: '3rem' }}></i>
          <h5 className="fw-bold text-dark mb-2">Página em Construção</h5>
          <p className="mb-0 mx-auto" style={{ maxWidth: '400px' }}>
            Esta secção será implementada numa fase posterior do projeto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitasPage;