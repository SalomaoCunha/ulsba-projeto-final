import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import type { AlteracaoComplexidade, AlteracaoPrioridade, TipoLocal, Utente } from '../types/utente';
import { NIVEIS_PRIORIDADE, NIVEIS_COMPLEXIDADE } from '@/config/niveis';
import type { PrioridadeValor, ComplexidadeValor } from '@/config/niveis';
import { UTILIZADOR_ATUAL } from '@/config/sessao';

interface Props {
  utente: Utente | null;
  show: boolean;
  onHide: () => void;
  onGuardar: (utenteAtualizado: Utente) => void;
}

const TIPOS_LOCAL: TipoLocal[] = ['Domicílio', 'Lar', 'Unidade de Saúde'];
const EQUIPAS: string[] = ['Equipa A', 'Equipa B'];

const EditarUtenteModal: React.FC<Props> = ({ utente, show, onHide, onGuardar }) => {
  // Inicializa já com a prop `utente` — o componente é remontado (via `key`
  // no DashboardPage) sempre que o utente a editar muda, por isso não
  // precisamos de useEffect para "sincronizar" isto.
  const [rascunho, setRascunho] = useState<Utente | null>(utente);
  const [motivo, setMotivo] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  if (!rascunho || !utente) return null;

  const prioridadeMudou = rascunho.prioridade !== utente.prioridade;
  const podeEditarEquipa = UTILIZADOR_ATUAL.papel === 'Coordenador';

  const validar = (): string[] => {
    const lista: string[] = [];
    if (!rascunho.nome.trim()) lista.push('O nome é obrigatório.');
    if (!rascunho.telefone.trim()) lista.push('O telefone é obrigatório.');
    if (!rascunho.ruaNumero.trim()) lista.push('A rua e número são obrigatórios.');
    if (!rascunho.codigoPostal.trim()) lista.push('O código postal é obrigatório.');
    if (!rascunho.localidade.trim()) lista.push('A localidade é obrigatória.');
    if (!rascunho.concelho.trim()) lista.push('O concelho é obrigatório.');
    if (prioridadeMudou && !motivo.trim()) {
      lista.push('O motivo é obrigatório quando a prioridade muda (RF10).');
    }
    return lista;
  };

  const handleGuardar = () => {
    const errosEncontrados = validar();
    if (errosEncontrados.length > 0) {
      setErros(errosEncontrados);
      return;
    }

    const agora = new Date().toISOString();
    let utenteFinal = rascunho;

    if (prioridadeMudou) {
      const alteracao: AlteracaoPrioridade = {
        prioridadeAnterior: utente.prioridade,
        prioridadeNova: rascunho.prioridade,
        motivo,
        data: agora,
        autor: UTILIZADOR_ATUAL.nome,
      };
      utenteFinal = { ...utenteFinal, historicoPrioridade: [...utenteFinal.historicoPrioridade, alteracao] };
    }

    if (rascunho.complexidade !== utente.complexidade) {
      const alteracao: AlteracaoComplexidade = {
        complexidadeAnterior: utente.complexidade,
        complexidadeNova: rascunho.complexidade,
        data: agora,
        autor: UTILIZADOR_ATUAL.nome,
      };
      utenteFinal = { ...utenteFinal, historicoComplexidade: [...utenteFinal.historicoComplexidade, alteracao] };
    }

    onGuardar(utenteFinal);
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Utente</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {erros.length > 0 && (
          <div className="alert alert-danger">
            {erros.map((erro, idx) => <div key={idx}>{erro}</div>)}
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

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Tipo de Local</Form.Label>
            <Form.Select
              value={rascunho.tipoLocal}
              onChange={(e) => setRascunho({ ...rascunho, tipoLocal: e.target.value as TipoLocal })}
            >
              {TIPOS_LOCAL.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {rascunho.tipoLocal !== 'Domicílio' && (
            <Form.Group className="mb-3">
              <Form.Label>Nome da Instituição</Form.Label>
              <Form.Control
                value={rascunho.nomeInstituicao ?? ''}
                onChange={(e) => setRascunho({ ...rascunho, nomeInstituicao: e.target.value })}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Rua e Número</Form.Label>
            <Form.Control
              value={rascunho.ruaNumero}
              onChange={(e) => setRascunho({ ...rascunho, ruaNumero: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Código Postal</Form.Label>
            <Form.Control
              value={rascunho.codigoPostal}
              onChange={(e) => setRascunho({ ...rascunho, codigoPostal: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Localidade</Form.Label>
            <Form.Control
              value={rascunho.localidade}
              onChange={(e) => setRascunho({ ...rascunho, localidade: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Concelho</Form.Label>
            <Form.Control
              value={rascunho.concelho}
              onChange={(e) => setRascunho({ ...rascunho, concelho: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cuidador Principal</Form.Label>
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

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Equipa Responsável</Form.Label>
            {podeEditarEquipa ? (
              <Form.Select
                value={rascunho.equipaResponsavel}
                onChange={(e) => setRascunho({ ...rascunho, equipaResponsavel: e.target.value })}
              >
                {EQUIPAS.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </Form.Select>
            ) : (
              <Form.Control value={rascunho.equipaResponsavel} disabled />
            )}
            {!podeEditarEquipa && (
              <Form.Text className="text-muted">Só o Coordenador pode atribuir a equipa.</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Complexidade</Form.Label>
            <Form.Select
              value={rascunho.complexidade}
              onChange={(e) => setRascunho({ ...rascunho, complexidade: e.target.value as ComplexidadeValor })}
            >
              {NIVEIS_COMPLEXIDADE.map((n) => (
                <option key={n.valor} value={n.valor}>{n.label}</option>
              ))}
            </Form.Select>
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

          {prioridadeMudou && (
            <Form.Group className="mb-3">
              <Form.Label>Motivo da Alteração de Prioridade</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Obrigatório: porque é que a prioridade mudou?"
              />
            </Form.Group>
          )}
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
