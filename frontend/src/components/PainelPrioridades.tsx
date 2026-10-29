import React from 'react';

interface Props {
  filtroAtivo: string | null;
  onAlterarFiltro: (prioridade: string | null) => void;
}

const NIVEIS = [
  { valor: 'Urgente 0 dias', icone: 'bi-exclamation-triangle-fill', cor: 'var(--prioridade-1-dot)', texto: '#fff' },
  { valor: 'Urgente 1 dia', icone: 'bi-bell-fill', cor: 'var(--prioridade-2-dot)', texto: '#fff' },
  { valor: 'Urgente 2 dias', icone: 'bi-exclamation-circle-fill', cor: 'var(--prioridade-3-dot)', texto: '#4a3b00' },
  { valor: 'Não urgente 1', icone: 'bi-clock-fill', cor: 'var(--prioridade-4-dot)', texto: '#4a3b00' },
  { valor: 'Não urgente 2', icone: 'bi-check-circle-fill', cor: 'var(--prioridade-5-dot)', texto: '#fff' },
];

const PainelPrioridades: React.FC<Props> = ({ filtroAtivo, onAlterarFiltro }) => {

  const handleClick = (prioridade: string) => {
    onAlterarFiltro(filtroAtivo === prioridade ? null : prioridade);
  };

  return (
    <div className="ulsba-card h-100 d-flex flex-column" style={{ minHeight: 0 }}>
      <h6 className="fw-bold text-dark text-center mb-3 flex-shrink-0">Prioridade / Urgência</h6>

      <div className="d-flex flex-column gap-2" style={{ overflowY: 'auto', minHeight: 0 }}>
        {NIVEIS.map((nivel) => {
          const ativo = filtroAtivo === null || filtroAtivo === nivel.valor;
          return (
            <button
              key={nivel.valor}
              onClick={() => handleClick(nivel.valor)}
              className="btn border-0 d-flex align-items-center gap-2 text-start py-2 px-3"
              style={{
                backgroundColor: nivel.cor,
                color: nivel.texto,
                borderRadius: '999px',
                opacity: ativo ? 1 : 0.45,
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <i className={`bi ${nivel.icone}`}></i>
              {nivel.valor}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-top flex-shrink-0">
        <p className="text-muted text-center mb-0" style={{ fontSize: '0.75rem' }}>
          Selecione a prioridade para filtrar o mapa. Clique novamente para limpar.
        </p>
      </div>
    </div>
  );
};

export default PainelPrioridades;
