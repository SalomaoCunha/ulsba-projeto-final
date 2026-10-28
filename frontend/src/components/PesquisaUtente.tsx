import React, { useState } from 'react';
import type { Utente } from '../types/utente';

interface Props {
  utentes: Utente[];
  onPesquisar: (termo: string) => void;
}

const PesquisaUtente: React.FC<Props> = ({ utentes, onPesquisar }) => {
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  
  // Estados para controlar as listas flutuantes
  const [resultadosNum, setResultadosNum] = useState<Utente[]>([]);
  const [mostrarDropNum, setMostrarDropNum] = useState(false);
  
  const [resultadosNome, setResultadosNome] = useState<Utente[]>([]);
  const [mostrarDropNome, setMostrarDropNome] = useState(false);

  // --- Lógica para o campo do Número ---
  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumero(val);
    if (val.trim()) {
      const filtrados = utentes.filter(u => u.numeroUtente.includes(val));
      setResultadosNum(filtrados);
      setMostrarDropNum(true);
    } else {
      setMostrarDropNum(false);
    }
  };

  // --- Lógica para o campo do Nome ---
  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNome(val);
    if (val.trim()) {
      const filtrados = utentes.filter(u => u.nome.toLowerCase().includes(val.toLowerCase()));
      setResultadosNome(filtrados);
      setMostrarDropNome(true);
    } else {
      setMostrarDropNome(false);
    }
  };

  // --- Lógica ao clicar numa das sugestões ---
  const selecionarUtente = (ut: Utente) => {
    setNumero(ut.numeroUtente);
    setNome(ut.nome);
    setMostrarDropNum(false);
    setMostrarDropNome(false);
    onPesquisar(ut.numeroUtente); 
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
        <h6 className="fw-bold mb-0 text-dark">Pesquisar Utente</h6>
      </div>
      
      <div className="card-body p-4">
        
        {/* --- Pesquisa por Número --- */}
        <div className="mb-3 position-relative">
          <label className="form-label text-muted small fw-medium mb-1">Número de Utente</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-light border-end-0" 
              placeholder="Ex: 12569"
              value={numero}
              onChange={handleNumChange}
              onFocus={() => numero.trim() && setMostrarDropNum(true)}
              // Usamos setTimeout para dar tempo de clicar na lista antes dela fechar
              onBlur={() => setTimeout(() => setMostrarDropNum(false), 200)}
            />
            <span 
              className="input-group-text bg-light border-start-0 text-muted" 
              style={{ cursor: 'pointer' }}
              onClick={() => numero.trim() && onPesquisar(numero)}
            >
              <i className="bi bi-search"></i>
            </span>
          </div>

          {/* Lista Flutuante (Dropdown) do Número */}
          {mostrarDropNum && resultadosNum.length > 0 && (
            <div className="list-group position-absolute w-100 shadow mt-1 border" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {resultadosNum.map((ut) => (
                <button 
                  key={ut.id}
                  type="button" 
                  className="list-group-item list-group-item-action d-flex gap-3 py-2 text-start"
                  onClick={() => selecionarUtente(ut)}
                >
                  <span className="text-muted" style={{ width: '45px' }}>{ut.numeroUtente}</span>
                  <span className="fw-medium text-dark">{ut.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- Separador --- */}
        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1 m-0 text-light border-2" />
          <span className="text-muted small px-3 fw-medium">OU</span>
          <hr className="flex-grow-1 m-0 text-light border-2" />
        </div>

        {/* --- Pesquisa por Nome --- */}
        <div className="position-relative">
          <label className="form-label text-muted small fw-medium mb-1">Nome do Utente</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-light border-end-0" 
              placeholder="Ex: maria ter..."
              value={nome}
              onChange={handleNomeChange}
              onFocus={() => nome.trim() && setMostrarDropNome(true)}
              onBlur={() => setTimeout(() => setMostrarDropNome(false), 200)}
            />
            <span 
              className="input-group-text bg-light border-start-0 text-muted" 
              style={{ cursor: 'pointer' }}
              onClick={() => nome.trim() && onPesquisar(nome)}
            >
              <i className="bi bi-search"></i>
            </span>
          </div>

          {/* Lista Flutuante (Dropdown) do Nome */}
          {mostrarDropNome && resultadosNome.length > 0 && (
            <div className="list-group position-absolute w-100 shadow mt-1 border" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {resultadosNome.map((ut) => (
                <button 
                  key={ut.id}
                  type="button" 
                  className="list-group-item list-group-item-action d-flex gap-3 py-2 text-start"
                  onClick={() => selecionarUtente(ut)}
                >
                  <span className="text-muted" style={{ width: '45px' }}>{ut.numeroUtente}</span>
                  <span className="fw-medium text-dark">{ut.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PesquisaUtente;