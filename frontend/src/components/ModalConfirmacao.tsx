import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: React.ReactNode;
  textoConfirmar?: string;
  textoAProcessar?: string;
  aProcessar?: boolean;
  confirmarDesabilitado?: boolean;
  children?: React.ReactNode;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Modal de confirmação genérico para qualquer ação destrutiva (apagar
// viatura, equipa, bloqueio, cancelar visita, etc.) — substitui o
// window.confirm() nativo do browser por um aviso consistente com o resto da
// interface, em vez de cada página reinventar o seu próprio diálogo.
// `children`, quando usado, aparece entre a mensagem e os botões — serve
// para pedir um campo extra (ex.: motivo) sem o componente ter de conhecer
// cada caso de uso.
const ModalConfirmacao: React.FC<Props> = ({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Apagar',
  textoAProcessar = 'A apagar...',
  aProcessar = false,
  confirmarDesabilitado = false,
  children,
  onConfirmar,
  onCancelar,
}) => (
  <Modal show={aberto} onHide={onCancelar} centered>
    <Modal.Header closeButton>
      <Modal.Title className="h6 fw-bold mb-0">{titulo}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="small">
      {mensagem}
      {children}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="light" className="border" onClick={onCancelar} disabled={aProcessar}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={onConfirmar} disabled={aProcessar || confirmarDesabilitado}>
        {aProcessar ? textoAProcessar : textoConfirmar}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ModalConfirmacao;
