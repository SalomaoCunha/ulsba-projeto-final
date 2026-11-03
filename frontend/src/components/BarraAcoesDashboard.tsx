import React from 'react';
import { useNavigate } from 'react-router-dom';

const BarraAcoesDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body p-3 d-flex flex-column flex-xl-row justify-content-between align-items-center gap-4">
        
        <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-xl-auto">
          <button 
            className="btn btn-success fw-medium d-flex align-items-center justify-content-center gap-2 px-4 shadow-sm w-100 w-sm-auto"
            onClick={() => navigate('/rotas')}
          >
            <i className="bi bi-signpost-split-fill"></i> Gerar Rota Ótima
          </button>
          
          <button 
            className="btn btn-light border text-dark fw-medium d-flex align-items-center justify-content-center gap-2 px-4 shadow-sm w-100 w-sm-auto"
            onClick={() => navigate('/utentes')}
          >
            <i className="bi bi-list-ul"></i> Ver Lista de Utentes
          </button>
        </div>

        <div className="d-flex flex-wrap flex-sm-nowrap justify-content-center gap-3 gap-md-4 text-muted small align-items-center w-100 w-xl-auto">
          
          <div className="d-flex align-items-center gap-2">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-people-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-medium mb-0 lh-1">Utentes</div>
              <strong className="text-dark fs-6">24</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-medium mb-0 lh-1">Urgentes</div>
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

          <div className="d-flex align-items-center gap-2 ms-sm-2 border-start-sm ps-sm-4 w-100 w-sm-auto justify-content-center mt-2 mt-sm-0 pt-2 pt-sm-0 border-top border-top-sm-0">
            <i className="bi bi-geo-alt fs-4 text-secondary"></i>
            <div>
              <div className="fw-medium mb-0 lh-1">Distância (aprox.)</div>
              <strong className="text-dark fs-6">42 km</strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BarraAcoesDashboard;