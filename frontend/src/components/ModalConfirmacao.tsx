import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: React.ReactNode;
  textoConfirmar?: string;
  aProcessar?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Modal de confirmação genérico para qualquer ação destrutiva (apagar
// viatura, equipa, bloqueio, etc.) — substitui o window.confirm() nativo do
// browser por um aviso consistente com o resto da interface, em vez de cada
// página reinventar o seu próprio diálogo.
const ModalConfirmacao: React.FC<Props> = ({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Apagar',
  aProcessar = false,
  onConfirmar,
  onCancelar,
}) => (
  <Modal show={aberto} onHide={onCancelar} centered>
    <Modal.Header closeButton>
      <Modal.Title className="h6 fw-bold mb-0">{titulo}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="small">{mensagem}</Modal.Body>
    <Modal.Footer>
      <Button variant="light" className="border" onClick={onCancelar} disabled={aProcessar}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={onConfirmar} disabled={aProcessar}>
        {aProcessar ? 'A apagar...' : textoConfirmar}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ModalConfirmacao;
