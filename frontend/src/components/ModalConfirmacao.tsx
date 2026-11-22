import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface Props {
  // Controla a visibilidade do modal.
  aberto: boolean;
  // Título apresentado no cabeçalho do modal.
  titulo: string;
  // Texto/elemento de aviso principal (aceita React.ReactNode para permitir
  // formatação, p.ex. destacar o nome da entidade a apagar em negrito).
  mensagem: React.ReactNode;
  // Texto do botão de confirmação; por omissão assume uma ação de apagar.
  textoConfirmar?: string;
  // Texto do botão enquanto a ação está em curso (ex.: "A apagar...").
  textoAProcessar?: string;
  // true enquanto o pedido ao backend está em curso — desativa ambos os botões.
  aProcessar?: boolean;
  // Permite desativar só o botão de confirmar (ex.: falta preencher um campo
  // obrigatório em `children`), sem bloquear o "Cancelar".
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
