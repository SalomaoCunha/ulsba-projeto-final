import React from 'react';
import EmConstrucaoPage from '../components/EmConstrucaoPage';

// Página de Mensagens: ainda não tem funcionalidade própria, apenas mostra
// o ecrã genérico "em construção" com o título e ícone desta secção.
const MensagensPage: React.FC = () => (
  <EmConstrucaoPage
    titulo="Mensagens"
    icone="bi-envelope"
    descricao="Esta secção será implementada numa fase posterior do projeto."
  />
);

export default MensagensPage;
