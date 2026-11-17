import React from 'react';

interface Props {
  mensagem?: string;
}

const EcraCarregamento: React.FC<Props> = ({ mensagem = 'A carregar...' }) => (
  <div className="h-100 d-flex flex-column align-items-center justify-content-center gap-3 text-muted">
    <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">A carregar...</span>
    </div>
    <p className="small text-center mb-0" style={{ maxWidth: '320px' }}>{mensagem}</p>
  </div>
);

export default EcraCarregamento;
