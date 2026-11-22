import React from 'react';

interface Props {
  // Texto apresentado abaixo do spinner, para dar contexto sobre o que está
  // a ser carregado (ex.: "A carregar utentes..."). Opcional — por omissão
  // mostra uma mensagem genérica.
  mensagem?: string;
}

// Ecrã de carregamento genérico (spinner + mensagem), usado como placeholder
// enquanto uma página/componente aguarda dados assíncronos do backend.
const EcraCarregamento: React.FC<Props> = ({ mensagem = 'A carregar...' }) => (
  <div className="h-100 d-flex flex-column align-items-center justify-content-center gap-3 text-muted">
    <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">A carregar...</span>
    </div>
    <p className="small text-center mb-0" style={{ maxWidth: '320px' }}>{mensagem}</p>
  </div>
);

export default EcraCarregamento;
