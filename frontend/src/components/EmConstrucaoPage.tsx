import React from 'react';

interface Props {
  titulo: string;
  descricao: string;
  icone: string;
}

const EmConstrucaoPage: React.FC<Props> = ({ titulo, descricao, icone }) => {
  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">{titulo}</h1>
          <p className="text-muted mb-0 small">Módulo em desenvolvimento</p>
        </div>
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center text-muted p-5">
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
            <i className={`bi ${icone}`} style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">Página em Construção</h5>
          <p className="mb-0 mx-auto" style={{ maxWidth: '400px' }}>{descricao}</p>
        </div>
      </div>
    </div>
  );
};

export default EmConstrucaoPage;
