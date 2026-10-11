import React, { useEffect, useState } from 'react';
import type { Utente } from '../types/utente';
import { getUtentesFicticios } from '../services/utenteService';

const UtentesPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega os dados simulados quando a página abre
  useEffect(() => {
    const carregarDados = async () => {
      const dados = await getUtentesFicticios();
      setUtentes(dados);
      setLoading(false);
    };
    carregarDados();
  }, []);

  // Função auxiliar para definir a cor da badge de prioridade automaticamente
  const getBadgePrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'Urgente 0 dias': return 'bg-danger';
      case 'Urgente 1 dia': return 'bg-warning text-dark';
      case 'Urgente 2 dias': return 'bg-warning bg-opacity-75 text-dark';
      case 'Não urgente 1': return 'bg-info text-dark';
      case 'Não urgente 2': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Cabeçalho da Página */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Lista de Utentes</h1>
          <p className="text-muted mb-0 small">Gestão global de pacientes no domicílio</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-person-plus-fill"></i>
          Novo Utente
        </button>
      </div>

      {/* Tabela de Utentes */}
      <div className="card shadow-sm border-0 flex-grow-1 overflow-hidden">
        <div className="card-body p-0 d-flex flex-column">
          
          {loading ? (
            <div className="d-flex align-items-center justify-content-center flex-grow-1 p-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">A carregar...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th scope="col" className="ps-4 text-secondary fw-semibold">N.º Utente</th>
                    <th scope="col" className="text-secondary fw-semibold">Nome</th>
                    <th scope="col" className="text-secondary fw-semibold">Telefone</th>
                    <th scope="col" className="text-secondary fw-semibold">Localidade</th>
                    <th scope="col" className="text-secondary fw-semibold">Prioridade</th>
                    <th scope="col" className="text-secondary fw-semibold">Estado</th>
                    <th scope="col" className="text-end pe-4 text-secondary fw-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {utentes.map((utente) => (
                    <tr key={utente.id} style={{ cursor: 'pointer' }}>
                      <td className="ps-4 fw-medium text-secondary">{utente.numeroUtente}</td>
                      <td className="fw-bold text-dark">{utente.nome}</td>
                      <td>{utente.telefone}</td>
                      
                      {/* Extrai a localidade da morada (assume-se que está na segunda linha do texto) */}
                      <td className="text-muted text-truncate" style={{ maxWidth: '150px' }}>
                        {utente.morada.includes('\n') ? utente.morada.split('\n')[1] : utente.morada}
                      </td>
                      
                      <td>
                        <span className={`badge ${getBadgePrioridade(utente.prioridade)}`}>
                          {utente.prioridade}
                        </span>
                      </td>
                      
                      <td>
                        <span className={`badge ${utente.estado === 'Ativo' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'} px-3 py-1 rounded-pill`}>
                          {utente.estado}
                        </span>
                      </td>
                      
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-light text-primary me-2 border" title="Ver Detalhes">
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button className="btn btn-sm btn-light text-secondary border" title="Editar">
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Estado vazio caso o backend não devolva dados */}
                  {utentes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        Nenhum utente encontrado no sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default UtentesPage;