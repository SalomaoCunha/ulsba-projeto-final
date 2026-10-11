import React from 'react';

interface Props {
  filtroAtivo: string | null;
  onAlterarFiltro: (prioridade: string | null) => void;
}

const PainelPrioridades: React.FC<Props> = ({ filtroAtivo, onAlterarFiltro }) => {
  
  // Função auxiliar para mudar o filtro (se clicar no mesmo que já está ativo, ele limpa o filtro)
  const handleClick = (prioridade: string) => {
    if (filtroAtivo === prioridade) {
      onAlterarFiltro(null); // Desmarca
    } else {
      onAlterarFiltro(prioridade); // Marca
    }
  };

  // Função para aplicar um estilo diferente se o botão estiver selecionado
  const getOpacidade = (prioridade: string) => {
    return filtroAtivo && filtroAtivo !== prioridade ? 'opacity-50' : 'opacity-100';
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0 text-center">
        <h6 className="fw-bold mb-0 text-dark">Prioridade / Urgência</h6>
      </div>
      
      <div className="card-body p-3 d-flex flex-column gap-2 justify-content-start mt-2">
        <button 
          onClick={() => handleClick('Urgente 0 dias')}
          className={`btn btn-danger w-100 py-3 fw-medium shadow-sm text-start d-flex align-items-center ${getOpacidade('Urgente 0 dias')}`}>
          <i className="bi bi-exclamation-triangle-fill me-3 fs-5"></i> Urgente 0 dias
        </button>
        
        <button 
          onClick={() => handleClick('Urgente 1 dia')}
          className={`btn text-white w-100 py-3 fw-medium shadow-sm text-start d-flex align-items-center ${getOpacidade('Urgente 1 dia')}`} style={{ backgroundColor: '#fd7e14' }}>
          <i className="bi bi-bell-fill me-3 fs-5"></i> Urgente 1 dia
        </button>
        
        <button 
          onClick={() => handleClick('Urgente 2 dias')}
          className={`btn btn-warning w-100 py-3 fw-medium shadow-sm text-start d-flex align-items-center text-dark border-0 ${getOpacidade('Urgente 2 dias')}`}>
          <i className="bi bi-exclamation-circle-fill me-3 fs-5"></i> Urgente 2 dias
        </button>
        
        <button 
          onClick={() => handleClick('Não urgente 1')}
          className={`btn w-100 py-3 fw-medium shadow-sm text-start d-flex align-items-center text-dark ${getOpacidade('Não urgente 1')}`} style={{ backgroundColor: '#ffda6a' }}>
          <i className="bi bi-clock-fill me-3 fs-5"></i> Não urgente 1
        </button>
        
        <button 
          onClick={() => handleClick('Não urgente 2')}
          className={`btn btn-success w-100 py-3 fw-medium shadow-sm text-start d-flex align-items-center border-0 ${getOpacidade('Não urgente 2')}`} style={{ backgroundColor: '#20c997' }}>
          <i className="bi bi-check-circle-fill me-3 fs-5"></i> Não urgente 2
        </button>

        <div className="mt-4 pt-3 border-top border-light">
          <p className="text-muted small text-center mb-0" style={{ fontSize: '0.8rem' }}>
            Selecione a prioridade para filtrar o mapa. Clique novamente para limpar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PainelPrioridades;