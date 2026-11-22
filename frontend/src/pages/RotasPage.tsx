import React from 'react';
import EmConstrucaoPage from '../components/EmConstrucaoPage';

// Página placeholder — a otimização de rotas ainda não está implementada
// (depende de trabalho externo à cadeira de PI), mostra-se só o aviso de "em construção".
const RotasPage: React.FC = () => (
  <EmConstrucaoPage
    titulo="Rotas"
    icone="bi-signpost-split"
    descricao="A otimização de rotas depende do algoritmo da docente de Matemática. Esta secção é apenas um placeholder visual por agora."
  />
);

export default RotasPage;
