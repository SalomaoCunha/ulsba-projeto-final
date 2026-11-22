import React from 'react';
import EmConstrucaoPage from '../components/EmConstrucaoPage';

// Página placeholder — o módulo de Relatórios ainda não está implementado,
// mostra-se apenas o aviso genérico de "em construção".
const RelatoriosPage: React.FC = () => (
  <EmConstrucaoPage
    titulo="Relatórios"
    icone="bi-bar-chart"
    descricao="Esta secção será implementada numa fase posterior do projeto."
  />
);

export default RelatoriosPage;
