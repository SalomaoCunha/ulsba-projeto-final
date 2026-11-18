import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import type { TipoLocal, Utente } from '../types/utente';
import { NIVEIS_PRIORIDADE, NIVEIS_COMPLEXIDADE } from '@/config/niveis';
import type { PrioridadeValor, ComplexidadeValor } from '@/config/niveis';
import { alterarPrioridade, alterarComplexidade, alterarEquipaResponsavel, updateUtente, getUtenteById } from '../services/utenteService';
import { getNiveisUrgencia, getNiveisComplexidade } from '../services/nivelService';
import { getEquipas } from '../services/equipaService';
import { getUtilizadorAtual } from '../services/authService';
import type { NivelUrgenciaDTO, NivelComplexidadeDTO } from '../types/nivel';
import type { Equipa } from '../types/equipa';

interface Props {
  utente: Utente | null;
  show: boolean;
  onHide: () => void;
  onGuardar: (utenteAtualizado: Utente) => void;
}

const TIPOS_LOCAL: TipoLocal[] = ['Domicílio', 'Lar', 'Unidade de Saúde'];

const EditarUtenteModal: React.FC<Props> = ({ utente, show, onHide, onGuardar }) => {
  // Inicializa já com a prop `utente` — o componente é remontado (via `key`
  // no DashboardPage/UtentesPage) sempre que o utente a editar muda, por
  // isso não precisamos de useEffect para "sincronizar" isto.
  const [rascunho, setRascunho] = useState<Utente | null>(utente);
  const [motivo, setMotivo] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [aGuardar, setAGuardar] = useState(false);

  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [niveisUrgencia, setNiveisUrgencia] = useState<NivelUrgenciaDTO[]>([]);
  const [niveisComplexidade, setNiveisComplexidade] = useState<NivelComplexidadeDTO[]>([]);
  const [podeEditarEquipa, setPodeEditarEquipa] = useState(false);

  useEffect(() => {
    getEquipas().then(setEquipas).catch((erro) => console.error('Falha ao carregar equipas:', erro));
    getNiveisUrgencia().then(setNiveisUrgencia).catch((erro) => console.error('Falha ao carregar níveis de urgência:', erro));
    getNiveisComplexidade().then(setNiveisComplexidade).catch((erro) => console.error('Falha ao carregar níveis de complexidade:', erro));
    getUtilizadorAtual()
      .then((u) => setPodeEditarEquipa(u.perfil === 'COORDENADOR'))
      .catch((erro) => console.error('Falha ao carregar utilizador autenticado:', erro));
  }, []);

  if (!rascunho || !utente) return null;

  const prioridadeMudou = rascunho.prioridade !== utente.prioridade;
  const complexidadeMudou = rascunho.complexidade !== utente.complexidade;
  const equipaMudou = rascunho.equipaResponsavel !== utente.equipaResponsavel;

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

  const handleGuardar = async () => {
    const errosEncontrados = validar();
    if (errosEncontrados.length > 0) {
      setErros(errosEncontrados);
      return;
    }

    setAGuardar(true);
    try {
      // Dados base (nome, contacto, notas...) vão sempre pelo PUT normal.
      let utenteFinal = await updateUtente(rascunho);

      // Prioridade, complexidade e equipa têm endpoints próprios, porque
      // cada um gera o seu próprio histórico auditável — só se chamam
      // quando o valor realmente mudou.
      if (prioridadeMudou) {
        const nivel = niveisUrgencia.find((n) => n.designacao === rascunho.prioridade);
        if (nivel) {
          await alterarPrioridade(utente.id, nivel.id, motivo);
        }
      }

      if (complexidadeMudou) {
        const nivel = niveisComplexidade.find((n) => n.designacao === rascunho.complexidade);
        if (nivel) {
          await alterarComplexidade(utente.id, nivel.id);
        }
      }

      if (equipaMudou && podeEditarEquipa) {
        const equipa = equipas.find((e) => `Equipa ${e.codigo}` === rascunho.equipaResponsavel);
        if (equipa) {
          await alterarEquipaResponsavel(utente.id, equipa.id);
        }
      }

      // Depois de todas as alterações gravadas, relê o utente para o ecrã
      // mostrar o estado real e atualizado da BD (prioridade/complexidade/
      // equipa só se refletem aqui depois dos POSTs acima).
      if (prioridadeMudou || complexidadeMudou || equipaMudou) {
        utenteFinal = await getUtenteById(String(utente.id));
      }

      onGuardar(utenteFinal);
    } catch (erro) {
      console.error('Falha ao guardar utente:', erro);
      setErros(['Não foi possível guardar as alterações. Tenta novamente.']);
    } finally {
      setAGuardar(false);
    }
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
                {equipas.map((eq) => (
                  <option key={eq.id} value={`Equipa ${eq.codigo}`}>{`Equipa ${eq.codigo}`}</option>
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
        <Button variant="light" onClick={onHide} disabled={aGuardar}>Cancelar</Button>
        <Button variant="success" onClick={handleGuardar} disabled={aGuardar}>
          {aGuardar ? 'A guardar...' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditarUtenteModal;
