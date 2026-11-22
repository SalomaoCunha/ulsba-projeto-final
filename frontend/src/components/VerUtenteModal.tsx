import React from 'react';
import { Modal } from 'react-bootstrap';
import type { Utente } from '../types/utente';
import FichaUtenteCard from './FichaUtenteCard';

interface Props {
  // Utente a mostrar; se for null o modal não chega a renderizar conteúdo.
  utente: Utente | null;
  // Controla a visibilidade do modal (prop `show` do react-bootstrap).
  show: boolean;
  // Chamado ao fechar o modal (botão de fecho, clique fora, Esc).
  onHide: () => void;
  // Chamado quando o utilizador quer passar da visualização para a edição
  // (o botão "Editar" vive dentro do FichaUtenteCard, não aqui).
  onEditar: () => void;
}

// Modal de só-leitura que mostra a ficha completa de um utente, reutilizando
// o FichaUtenteCard (o mesmo cartão usado no Dashboard) dentro de um Modal do
// react-bootstrap. Serve para consultar os detalhes sem sair da página atual.
const VerUtenteModal: React.FC<Props> = ({ utente, show, onHide, onEditar }) => {
  if (!utente) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ficha do Utente</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        <FichaUtenteCard utente={utente} onEditar={onEditar} />
      </Modal.Body>
    </Modal>
  );
};

export default VerUtenteModal;
