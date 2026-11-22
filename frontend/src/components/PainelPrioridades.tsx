import React from 'react';
import { NIVEIS_PRIORIDADE } from '@/config/niveis';

interface Props {
  // Prioridade atualmente selecionada para filtrar o mapa (null = sem filtro, mostra todas).
  filtroAtivo: string | null;
  // Chamado quando o utilizador escolhe/limpa uma prioridade; o componente
  // pai é que guarda o estado e o usa para filtrar os pinos no MapaLeaflet.
  onAlterarFiltro: (prioridade: string | null) => void;
}

// Painel lateral do Dashboard com a lista de níveis de prioridade/urgência,
// usado para filtrar visualmente quais utentes aparecem no mapa.
const PainelPrioridades: React.FC<Props> = ({ filtroAtivo, onAlterarFiltro }) => {

  // Clicar na prioridade já ativa desliga o filtro (toggle); clicar numa
  // diferente substitui o filtro ativo.
  const handleClick = (prioridade: string) => {
    onAlterarFiltro(filtroAtivo === prioridade ? null : prioridade);
  };

  return (
    <div className="ulsba-card h-100 d-flex flex-column" style={{ minHeight: 0 }}>
      <h6 className="fw-bold text-dark text-center mb-3 flex-shrink-0">Prioridade / Urgência</h6>

      <div className="d-flex flex-column gap-2" style={{ overflowY: 'auto', minHeight: 0 }}>
        {NIVEIS_PRIORIDADE.map((nivel) => {
          const ativo = filtroAtivo === null || filtroAtivo === nivel.valor;
          return (
            <button
              key={nivel.valor}
              onClick={() => handleClick(nivel.valor)}
              className="btn border-0 d-flex align-items-center gap-2 text-start py-2 px-3"
              style={{
                backgroundColor: nivel.corDot,
                color: nivel.corTexto,
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
