import React, { useState } from 'react';

interface Props {
  onPesquisar: (termo: string) => void;
}

const PesquisaUtente: React.FC<Props> = ({ onPesquisar }) => {
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');

  const handlePesquisaNumero = () => {
    if (numero.trim()) onPesquisar(numero);
  };

  const handlePesquisaNome = () => {
    if (nome.trim()) onPesquisar(nome);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
        <h6 className="fw-bold mb-0 text-dark">Pesquisar Utente</h6>
      </div>
      
      <div className="card-body p-4">
        {/* Pesquisa por Número */}
        <div className="mb-3">
          <label className="form-label text-muted small fw-medium mb-1">Número de Utente</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-light border-end-0" 
              placeholder="Ex: 12569"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePesquisaNumero()}
            />
            <span 
              className="input-group-text bg-light border-start-0 text-muted" 
              style={{ cursor: 'pointer' }}
              onClick={handlePesquisaNumero}
            >
              <i className="bi bi-search"></i>
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1 m-0 text-light border-2" />
          <span className="text-muted small px-3 fw-medium">OU</span>
          <hr className="flex-grow-1 m-0 text-light border-2" />
        </div>

        {/* Pesquisa por Nome */}
        <div>
          <label className="form-label text-muted small fw-medium mb-1">Nome do Utente</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-light border-end-0" 
              placeholder="Ex: Maria Teresa..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePesquisaNome()}
            />
            <span 
              className="input-group-text bg-light border-start-0 text-muted" 
              style={{ cursor: 'pointer' }}
              onClick={handlePesquisaNome}
            >
              <i className="bi bi-search"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesquisaUtente;