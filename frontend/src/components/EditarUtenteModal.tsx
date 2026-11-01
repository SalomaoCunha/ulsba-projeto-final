import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import type { Utente } from '../types/utente';
import { NIVEIS_PRIORIDADE } from '@/config/niveis';
import type { PrioridadeValor } from '@/config/niveis';

interface Props {
  utente: Utente | null;
  show: boolean;
  onHide: () => void;
  onGuardar: (utenteAtualizado: Utente) => void;
}

const EditarUtenteModal: React.FC<Props> = ({ utente, show, onHide, onGuardar }) => {
  // Inicializa já com a prop `utente` — o componente é remontado (via `key`
  // no DashboardPage) sempre que o utente a editar muda, por isso não
  // precisamos de useEffect para "sincronizar" isto.
  const [rascunho, setRascunho] = useState<Utente | null>(utente);
  const [erros, setErros] = useState<string[]>([]);

  const validar = (): string[] => {
    // TODO: valida o `rascunho`, devolve lista de mensagens de erro
    return [];
  };

  const handleGuardar = () => {
    if (!rascunho) return;

    const errosEncontrados = validar();
    if (errosEncontrados.length > 0) {
      setErros(errosEncontrados);
      return;
    }

    // TODO: detetar mudança de prioridade + histórico, depois:
    onGuardar(rascunho);
  };

  if (!rascunho) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Utente</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {erros.length > 0 && (
          <div className="alert alert-danger">
            {/* TODO: listar erros */}
          </div>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
                value={rascunho.nome}
                onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
                value={rascunho.telefone}
                onChange={(e) => setRascunho({ ...rascunho, telefone: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Morada</Form.Label>
            <Form.Control
                value={rascunho.morada}
                onChange={(e) => setRascunho({ ...rascunho, morada: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cuidador principal</Form.Label>
            <Form.Control
                value={rascunho.cuidadorPrincipal}
                onChange={(e) => setRascunho({ ...rascunho, cuidadorPrincipal: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Notas</Form.Label>
            <Form.Control
                value={rascunho.notas}
                onChange={(e) => setRascunho({ ...rascunho, notas: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Prioridade</Form.Label>
            <Form.Select
                value={rascunho.prioridade}
                onChange={(e) => setRascunho({ ...rascunho, prioridade: e.target.value as PrioridadeValor })}
            >
                {NIVEIS_PRIORIDADE.map((n) => (
                     <option key={n.valor} value={n.valor}>{n.label}</option>
                ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Cancelar</Button>
        <Button variant="success" onClick={handleGuardar}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditarUtenteModal;
