import React from 'react';

const BarraAcoesDashboard: React.FC = () => {
  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
        
        {/* Lado Esquerdo: Botões de Ação */}
        <div className="d-flex gap-3">
          <button 
            className="btn btn-success fw-medium d-flex align-items-center gap-2 px-4 shadow-sm"
            onClick={() => alert('[ÁREA PARA API] Algoritmo de Rotas será ativado aqui!')}
          >
            <i className="bi bi-signpost-split-fill"></i> Gerar Rota Ótima
          </button>
          
          <button 
            className="btn btn-light border text-dark fw-medium d-flex align-items-center gap-2 px-4 shadow-sm"
          >
            <i className="bi bi-list-ul"></i> Ver Lista de Utentes
          </button>
        </div>

        {/* Lado Direito: Estatísticas Dinâmicas */}
        <div className="d-flex flex-wrap gap-4 text-muted small align-items-center">
          
          <div className="d-flex align-items-center gap-2">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-people-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-medium mb-0 lh-1">Utentes no mapa</div>
              <strong className="text-dark fs-6">24</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-medium mb-0 lh-1">Urgentes (0-2 dias)</div>
              <strong className="text-dark fs-6">12</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-clock-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-medium mb-0 lh-1">Não urgentes</div>
              <strong className="text-dark fs-6">12</strong>
            </div>
          </div>

          {/* Divisória vertical e Distância Total */}
          <div className="d-flex align-items-center gap-2 ms-2 border-start ps-4">
            <i className="bi bi-geo-alt fs-4 text-secondary"></i>
            <div>
              <div className="fw-medium mb-0 lh-1">Distância total (aprox.)</div>
              <strong className="text-dark fs-6">42 km</strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BarraAcoesDashboard;