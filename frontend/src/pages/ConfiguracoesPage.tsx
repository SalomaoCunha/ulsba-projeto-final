import React from 'react';
import EmConstrucaoPage from '../components/EmConstrucaoPage';

// Página de Configurações: ainda não tem funcionalidade própria, apenas mostra
// o ecrã genérico "em construção" com o título e ícone desta secção.
const ConfiguracoesPage: React.FC = () => (
  <EmConstrucaoPage
    titulo="Configurações"
    icone="bi-gear"
    descricao="Esta secção será implementada numa fase posterior do projeto."
  />
);

export default ConfiguracoesPage;
