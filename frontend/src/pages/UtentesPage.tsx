import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Dados fictícios para preencher a tabela e dar um aspeto real
const mockUtentesList = [
  { id: 1, num: '12569', nome: 'Maria Teresa Almeida', contacto: '912 345 678', ultimaVisita: '02-10-2026', prioridade: 'Urgente 0 dias', estado: 'Ativo' },
  { id: 2, num: '12560', nome: 'Maria Teresa Godinho', contacto: '912 345 671', ultimaVisita: '01-10-2026', prioridade: 'Urgente 1 dia', estado: 'Ativo' },
  { id: 3, num: '12570', nome: 'Maria Teresa Silva', contacto: '912 345 674', ultimaVisita: '05-10-2026', prioridade: 'Urgente 2 dias', estado: 'Ativo' },
  { id: 4, num: '12561', nome: 'Maria Teresa Sousa', contacto: '912 345 672', ultimaVisita: '28-09-2026', prioridade: 'Não urgente 1', estado: 'Ativo' },
  { id: 5, num: '12562', nome: 'Maria Isabel Ferreira', contacto: '912 345 673', ultimaVisita: '15-09-2026', prioridade: 'Não urgente 2', estado: 'Inativo' },
];

const UtentesPage: React.FC = () => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const navigate = useNavigate();

  // Função auxiliar para renderizar a cor certa da prioridade
  const getBadgePrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'Urgente 0 dias': return <span className="badge bg-danger fw-normal px-2 py-1">Urgente 0 dias</span>;
      case 'Urgente 1 dia': return <span className="badge text-white fw-normal px-2 py-1" style={{ backgroundColor: '#fd7e14' }}>Urgente 1 dia</span>;
      case 'Urgente 2 dias': return <span className="badge bg-warning text-dark fw-normal px-2 py-1">Urgente 2 dias</span>;
      case 'Não urgente 1': return <span className="badge text-dark fw-normal px-2 py-1" style={{ backgroundColor: '#ffda6a' }}>Não urgente 1</span>;
      case 'Não urgente 2': return <span className="badge bg-success fw-normal px-2 py-1">Não urgente 2</span>;
      default: return <span className="badge bg-secondary fw-normal px-2 py-1">{prioridade}</span>;
    }
  };

  // Função auxiliar para renderizar o estado com o estilo do teu mockup
  const getBadgeEstado = (estado: string) => {
    if (estado === 'Ativo') {
      return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">Ativo</span>;
    }
    return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 rounded-pill">Inativo</span>;
  };

  return (
    <div className="h-100 d-flex flex-column">
      
      {/* Cabeçalho da Página */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Lista de Utentes</h1>
          <p className="text-muted mb-0 small">Gestão e consulta do diretório de pacientes</p>
        </div>
        <button 
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={() => navigate('/utentes/novo')}
        >
          <i className="bi bi-person-plus"></i>
          Novo Utente
        </button>
      </div>

      {/* Cartão Branco Principal */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden">
        
        {/* Barra de Ferramentas (Filtros) */}
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <div className="input-group w-auto" style={{ minWidth: '300px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control bg-light border-start-0" 
              placeholder="Pesquisar por nome ou número..." 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
          </div>
          
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <i className="bi bi-funnel"></i> Filtros
            </button>
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <i className="bi bi-download"></i> Exportar
            </button>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">N.º Utente</th>
                <th className="fw-medium border-bottom-0 py-3">Nome</th>
                <th className="fw-medium border-bottom-0 py-3">Contacto</th>
                <th className="fw-medium border-bottom-0 py-3">Última Visita</th>
                <th className="fw-medium border-bottom-0 py-3">Prioridade</th>
                <th className="fw-medium border-bottom-0 py-3">Estado</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {mockUtentesList.map((utente) => (
                <tr key={utente.id}>
                  <td className="ps-4 py-3 text-muted">{utente.num}</td>
                  <td className="py-3 fw-medium text-dark">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                      {utente.nome}
                    </div>
                  </td>
                  <td className="py-3 text-muted">{utente.contacto}</td>
                  <td className="py-3 text-muted">{utente.ultimaVisita}</td>
                  <td className="py-3">{getBadgePrioridade(utente.prioridade)}</td>
                  <td className="py-3">{getBadgeEstado(utente.estado)}</td>
                  <td className="pe-4 py-3 text-end">
                    <button className="btn btn-sm btn-light text-primary me-2 shadow-sm border">
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-light text-secondary shadow-sm border">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Rodapé da Tabela com Paginação */}
        <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center text-muted small">
          <span>A mostrar 1 a 5 de 24 utentes</span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled"><a className="page-link" href="#">Anterior</a></li>
              <li className="page-item active"><a className="page-link bg-success border-success" href="#">1</a></li>
              <li className="page-item"><a className="page-link text-success" href="#">2</a></li>
              <li className="page-item"><a className="page-link text-success" href="#">3</a></li>
              <li className="page-item"><a className="page-link text-success" href="#">Próximo</a></li>
            </ul>
          </nav>
        </div>

      </div>
    </div>
  );
};

export default UtentesPage;