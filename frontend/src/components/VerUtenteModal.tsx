import React from 'react';
import { Modal } from 'react-bootstrap';
import type { Utente } from '../types/utente';
import FichaUtenteCard from './FichaUtenteCard';

interface Props {
  utente: Utente | null;
  show: boolean;
  onHide: () => void;
  onEditar: () => void;
}

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
