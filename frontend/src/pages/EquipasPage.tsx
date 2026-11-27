import React, { useState, useEffect } from 'react';
import {
  createEquipa,
  createProfissional,
  deleteEquipa,
  getEquipas,
  getFuncoesProfissional,
  getProfissionaisEquipa,
  updateEquipa,
} from '../services/equipaService';
import { getViaturas } from '../services/viaturaService';
import type {
  DadosEquipa,
  Equipa,
  FuncaoProfissional,
  ProfissionalEquipa,
} from '../types/equipa';
import type { Viatura } from '../types/viatura';
import EcraCarregamento from '../components/EcraCarregamento';
import ModalConfirmacao from '../components/ModalConfirmacao';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';

interface FormularioEquipa {
  codigo: string;
  designacao: string;
  membros: number[]; // ids dos profissionais selecionados como membros da equipa
}

// Página de gestão de Equipas: lista as equipas existentes em cartões (com os
// seus membros e viaturas associadas), permite criar/editar equipas num modal
// e apagar (ou desativar, se tiver histórico) uma equipa.
const EquipasPage: React.FC = () => {
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalEquipa[]>([]);
  const [funcoes, setFuncoes] = useState<FuncaoProfissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [equipaEditandoId, setEquipaEditandoId] = useState<number | null>(null);
  const [dadosFormulario, setDadosFormulario] = useState<FormularioEquipa>({
    codigo: '',
    designacao: '',
    membros: [],
  });
  const [erroEquipa, setErroEquipa] = useState<string | null>(null);
  const [erroProfissionais, setErroProfissionais] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [aApagarId, setAApagarId] = useState<number | null>(null);
  const [avisoApagar, setAvisoApagar] = useState<string | null>(null);
  const [equipaParaApagar, setEquipaParaApagar] = useState<Equipa | null>(null);

  // Formulário inline de "Novo profissional", dentro do modal de equipa —
  // até agora os profissionais só existiam via seed da base de dados.
  const [modoCriarProfissional, setModoCriarProfissional] = useState(false);
  const [dadosNovoProfissional, setDadosNovoProfissional] = useState({
    nome: '',
    funcaoId: '',
    contactoTelefonico: '',
  });
  const [aGuardarProfissional, setAGuardarProfissional] = useState(false);
  const [erroNovoProfissional, setErroNovoProfissional] = useState<string | null>(null);

  // Carrega em paralelo as equipas, as viaturas (para as associar por
  // equipa_codigo) e a lista de profissionais disponíveis para seleção de
  // membros. Usa allSettled para que a falha de uma chamada não impeça as
  // outras de carregar; a falha em profissionais fica também visível no form.
  useEffect(() => {
    comAtrasoMinimo(
      Promise.allSettled([
        getEquipas().then(setEquipas).catch((erro) => console.error('Falha ao carregar equipas:', erro)),
        getViaturas().then(setViaturas).catch((erro) => console.error('Falha ao carregar viaturas:', erro)),
        getProfissionaisEquipa()
          .then(setProfissionais)
          .catch((erro) => {
            console.error('Falha ao carregar profissionais:', erro);
            setErroProfissionais('Não foi possível carregar a lista de profissionais.');
          }),
        getFuncoesProfissional()
          .then(setFuncoes)
          .catch((erro) => console.error('Falha ao carregar funções clínicas:', erro)),
      ]),
    ).finally(() => setCarregando(false));
  }, []);

  // Viaturas atualmente atribuídas a esta equipa (associação feita pelo
  // código da equipa, não pelo id).
  const viaturasDaEquipa = (equipa: Equipa) => {
    return viaturas.filter((viatura) => viatura.equipa_codigo === equipa.codigo);
  };

  // Viaturas sem qualquer equipa atribuída, mostradas num cartão separado.
  const viaturasSemEquipa = () => {
    return viaturas.filter((viatura) => viatura.equipa_codigo === null);
  };

  // Abre o modal em modo "criação": limpa o formulário e o id de edição.
  const abrirNovaEquipa = () => {
    setEquipaEditandoId(null);
    setDadosFormulario({ codigo: '', designacao: '', membros: [] });
    setErroEquipa(null);
    fecharFormularioNovoProfissional();
    setModalAberto(true);
  };

  // Abre o modal em modo "edição": pré-preenche o formulário com os dados
  // atuais da equipa, incluindo os ids dos membros já associados.
  const abrirEdicaoEquipa = (equipa: Equipa) => {
    setEquipaEditandoId(equipa.id);
    setDadosFormulario({
      codigo: equipa.codigo,
      designacao: equipa.designacao ?? '',
      membros: equipa.membros.map((membro) => membro.id),
    });
    setErroEquipa(null);
    fecharFormularioNovoProfissional();
    setModalAberto(true);
  };

  // Apaga a equipa; se o backend indicar que não foi mesmo apagada (porque
  // tem histórico associado), marca-a localmente como inativa e avisa o
  // utilizador, em vez de a remover da lista.
  const apagarEquipa = async (equipa: Equipa) => {
    setAApagarId(equipa.id);
    setAvisoApagar(null);
    try {
      const resultado = await deleteEquipa(equipa.id);
      if (resultado.apagada) {
        setEquipas((atuais) => atuais.filter((e) => e.id !== equipa.id));
      } else {
        // Tem histórico associado — o backend desativou-a em vez de apagar.
        setEquipas((atuais) =>
          atuais.map((e) => (e.id === equipa.id ? { ...e, ativa: false } : e)),
        );
        setAvisoApagar(
          `A Equipa ${equipa.codigo} tem histórico associado (membros, utentes ou voltas) e por isso foi desativada em vez de apagada.`,
        );
      }
    } catch (erro) {
      console.error('Falha ao apagar equipa:', erro);
      setAvisoApagar('Não foi possível apagar a equipa.');
    } finally {
      setAApagarId(null);
      setEquipaParaApagar(null);
    }
  };

  // Fecha o modal, exceto enquanto um guardar estiver em curso (evita fechar
  // a meio de um pedido à API).
  const fecharModal = () => {
    if (aGuardar) return;
    setModalAberto(false);
    setErroEquipa(null);
    fecharFormularioNovoProfissional();
  };

  // Adiciona ou remove um profissional da lista de membros selecionados no
  // formulário, conforme o checkbox correspondente é marcado/desmarcado.
  const alternarMembro = (profissionalId: number, selecionado: boolean) => {
    setDadosFormulario((atual) => ({
      ...atual,
      membros: selecionado
        ? [...atual.membros, profissionalId]
        : atual.membros.filter((id) => id !== profissionalId),
    }));
  };

  // Repõe o formulário de "novo profissional" ao estado inicial e esconde-o.
  const fecharFormularioNovoProfissional = () => {
    setModoCriarProfissional(false);
    setDadosNovoProfissional({ nome: '', funcaoId: '', contactoTelefonico: '' });
    setErroNovoProfissional(null);
  };

  // Cria um profissional de raiz (não existia nenhuma via de o fazer na app —
  // só entravam pelo seed da base de dados) e, uma vez criado, já o
  // adiciona à lista local e marca-o automaticamente como membro desta
  // equipa, poupando um segundo passo imediato a seguir.
  const criarProfissionalInline = async () => {
    const nome = dadosNovoProfissional.nome.trim();
    if (!nome) {
      setErroNovoProfissional('Indica o nome do profissional.');
      return;
    }
    if (!dadosNovoProfissional.funcaoId) {
      setErroNovoProfissional('Seleciona a função clínica do profissional.');
      return;
    }

    setErroNovoProfissional(null);
    setAGuardarProfissional(true);
    try {
      const criado = await createProfissional({
        nome,
        funcaoId: Number(dadosNovoProfissional.funcaoId),
        contactoTelefonico: dadosNovoProfissional.contactoTelefonico.trim() || null,
      });
      setProfissionais((atuais) => [...atuais, criado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')));
      setDadosFormulario((atual) => ({ ...atual, membros: [...atual.membros, criado.id] }));
      fecharFormularioNovoProfissional();
    } catch (erro) {
      console.error('Falha ao criar profissional:', erro);
      setErroNovoProfissional(
        erro instanceof Error ? erro.message : 'Não foi possível criar o profissional.',
      );
    } finally {
      setAGuardarProfissional(false);
    }
  };

  // Valida e submete o formulário: normaliza o código (maiúsculas, sem
  // espaços) e decide entre criar ou atualizar consoante exista ou não um
  // id de equipa em edição. Atualiza a lista local sem precisar de recarregar
  // tudo do servidor, inserindo a equipa nova já ordenada por código.
  const guardarEquipa = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const codigo = dadosFormulario.codigo.trim().toUpperCase();
    if (!codigo) {
      setErroEquipa('Indica o código da equipa.');
      return;
    }

    setErroEquipa(null);
    setAGuardar(true);
    try {
      const payload: DadosEquipa = {
        ...dadosFormulario,
        codigo,
        designacao: dadosFormulario.designacao.trim() || null,
      };
      const guardada = equipaEditandoId === null
        ? await createEquipa(payload)
        : await updateEquipa(equipaEditandoId, payload);

      setEquipas((atuais) => {
        const existe = atuais.some((equipa) => equipa.id === guardada.id);
        return existe
          ? atuais.map((equipa) => (equipa.id === guardada.id ? guardada : equipa))
          : [...atuais, guardada].sort((a, b) => a.codigo.localeCompare(b.codigo));
      });
      setModalAberto(false);
    } catch (erro) {
      console.error('Falha ao guardar equipa:', erro);
      setErroEquipa(
        erro instanceof Error ? erro.message : 'Não foi possível guardar a equipa.',
      );
    } finally {
      setAGuardar(false);
    }
  };

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column">

      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Equipas</h1>
          <p className="text-muted mb-0 small">Gestão de equipas, profissionais e viaturas associadas</p>
        </div>
        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={abrirNovaEquipa}
        >
          <i className="bi bi-plus-lg"></i>
          Nova Equipa
        </button>
      </div>

      {avisoApagar && (
        <div className="alert alert-warning alert-dismissible" role="alert">
          {avisoApagar}
          <button type="button" className="btn-close" onClick={() => setAvisoApagar(null)} aria-label="Fechar"></button>
        </div>
      )}

      {/* Grelha de Cartões por Equipa */}
      {equipas.length === 0 && (
        <div className="alert alert-info">
          Ainda não existem equipas. Usa “Nova Equipa” para criar a primeira.
        </div>
      )}
      <div className="row g-3">
        {equipas.map((equipa) => (
          <div key={equipa.id} className="col-12 col-md-6">
            <div className="ulsba-card h-100">

              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="fw-bold mb-0">Equipa {equipa.codigo}</h6>
                    {!equipa.ativa && (
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                        Inativa
                      </span>
                    )}
                  </div>
                  {equipa.designacao && (
                    <p className="text-muted small mb-2">{equipa.designacao}</p>
                  )}
                </div>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => abrirEdicaoEquipa(equipa)}
                    aria-label={`Editar equipa ${equipa.codigo}`}
                    title={`Editar equipa ${equipa.codigo}`}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setEquipaParaApagar(equipa)}
                    disabled={aApagarId === equipa.id}
                    aria-label={`Apagar equipa ${equipa.codigo}`}
                    title={`Apagar equipa ${equipa.codigo}`}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Profissionais</p>
                {equipa.membros.length > 0 ? (
                  equipa.membros.map((membro) => (
                    <div key={membro.id}>{membro.nome} — {membro.funcao}</div>
                  ))
                ) : (
                  <div className="small text-muted">Sem profissionais associados</div>
                )}
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Viaturas</p>
                {viaturasDaEquipa(equipa).map((viatura) => (
                  <div key={viatura.id} className="small mb-1">
                    <span className="fw-medium">{viatura.matricula}</span> — {viatura.designacao ?? 'Sem designação'} ({viatura.estado})
                  </div>
                ))}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Cartão "Sem equipa atribuída" */}
      {viaturasSemEquipa().length > 0 && (
        <div className="mt-3">
          <div className="ulsba-card">
            <p className="text-muted small fw-medium mb-1">Sem equipa atribuída</p>
            {viaturasSemEquipa().map((viatura) => (
              <div key={viatura.id} className="small mb-1">
                <span className="fw-medium">{viatura.matricula}</span> — {viatura.designacao ?? 'Sem designação'} ({viatura.estado})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de criação/edição de equipa, construído manualmente com classes
          Bootstrap (em vez do componente <Modal> do react-bootstrap) para
          poder fechar ao clicar fora (onMouseDown no overlay) enquanto o
          formulário interno continua a propagar os seus próprios cliques. */}
      {modalAberto && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-equipa-titulo"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
          onMouseDown={(evento) => {
            // Só fecha se o clique for diretamente no overlay (currentTarget),
            // não num clique que começou dentro do conteúdo do modal.
            if (evento.target === evento.currentTarget) fecharModal();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={guardarEquipa}>
                <div className="modal-header">
                  <h2 id="modal-equipa-titulo" className="modal-title fs-5">
                    {equipaEditandoId === null ? 'Nova equipa' : 'Editar equipa'}
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharModal}
                    disabled={aGuardar}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  {erroEquipa && <div className="alert alert-danger">{erroEquipa}</div>}
                  {erroProfissionais && (
                    <div className="alert alert-warning">{erroProfissionais}</div>
                  )}
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="equipa-codigo" className="form-label">Código *</label>
                      <input
                        id="equipa-codigo"
                        className="form-control"
                        value={dadosFormulario.codigo}
                        onChange={(evento) => setDadosFormulario((atual) => ({
                          ...atual,
                          codigo: evento.target.value,
                        }))}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-8">
                      <label htmlFor="equipa-designacao" className="form-label">
                        Designação (opcional)
                      </label>
                      <input
                        id="equipa-designacao"
                        className="form-control"
                        value={dadosFormulario.designacao}
                        onChange={(evento) => setDadosFormulario((atual) => ({
                          ...atual,
                          designacao: evento.target.value,
                        }))}
                        maxLength={80}
                        placeholder="Designação da equipa, sem presumir uma zona territorial"
                      />
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="form-label mb-0">Membros</p>
                        {!modoCriarProfissional && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm px-0"
                            onClick={() => setModoCriarProfissional(true)}
                            disabled={aGuardar}
                          >
                            <i className="bi bi-plus-circle me-1"></i>
                            Novo profissional
                          </button>
                        )}
                      </div>
                      {modoCriarProfissional && (
                        <div className="border rounded p-3 mb-3 bg-light-subtle">
                          <div className="row g-2 align-items-end">
                            <div className="col-12 col-md-5">
                              <label htmlFor="novo-profissional-nome" className="form-label small text-muted mb-1">
                                Nome *
                              </label>
                              <input
                                id="novo-profissional-nome"
                                className="form-control form-control-sm"
                                value={dadosNovoProfissional.nome}
                                onChange={(evento) =>
                                  setDadosNovoProfissional((atual) => ({ ...atual, nome: evento.target.value }))
                                }
                                placeholder="Ex.: Enf. Rita Fonseca"
                              />
                            </div>
                            <div className="col-12 col-md-3">
                              <label htmlFor="novo-profissional-funcao" className="form-label small text-muted mb-1">
                                Função *
                              </label>
                              <select
                                id="novo-profissional-funcao"
                                className="form-select form-select-sm"
                                value={dadosNovoProfissional.funcaoId}
                                onChange={(evento) =>
                                  setDadosNovoProfissional((atual) => ({ ...atual, funcaoId: evento.target.value }))
                                }
                              >
                                <option value="">Selecionar...</option>
                                {funcoes.map((funcao) => (
                                  <option key={funcao.id} value={funcao.id}>{funcao.designacao}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-12 col-md-4">
                              <label htmlFor="novo-profissional-contacto" className="form-label small text-muted mb-1">
                                Telefone
                              </label>
                              <input
                                id="novo-profissional-contacto"
                                className="form-control form-control-sm"
                                value={dadosNovoProfissional.contactoTelefonico}
                                onChange={(evento) =>
                                  setDadosNovoProfissional((atual) => ({
                                    ...atual,
                                    contactoTelefonico: evento.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          {erroNovoProfissional && (
                            <div className="alert alert-danger small mt-2 mb-0 py-1">{erroNovoProfissional}</div>
                          )}
                          <div className="d-flex justify-content-end gap-2 mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={fecharFormularioNovoProfissional}
                              disabled={aGuardarProfissional}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={criarProfissionalInline}
                              disabled={aGuardarProfissional}
                            >
                              {aGuardarProfissional ? 'A criar...' : 'Criar profissional'}
                            </button>
                          </div>
                        </div>
                      )}
                      {profissionais.length > 0 ? (
                        <div className="border rounded p-3 d-flex flex-column gap-2">
                          {profissionais.map((profissional) => {
                            const selecionado = dadosFormulario.membros.includes(profissional.id);
                            return (
                              <label
                                key={profissional.id}
                                className="form-check d-flex align-items-center gap-2 mb-0"
                              >
                                <input
                                  className="form-check-input mt-0"
                                  type="checkbox"
                                  checked={selecionado}
                                  // Um profissional inativo só fica desativado (não selecionável)
                                  // se ainda não for membro; se já estiver selecionado, mantém-se
                                  // editável para que seja possível remover a associação.
                                  disabled={!profissional.ativo && !selecionado}
                                  onChange={(evento) =>
                                    alternarMembro(profissional.id, evento.target.checked)
                                  }
                                />
                                <span className="form-check-label">
                                  {profissional.nome} — {profissional.funcao}
                                  {!profissional.ativo && ' (inativo)'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="small text-muted mb-0">Não existem profissionais registados.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={fecharModal}
                    disabled={aGuardar}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={aGuardar || Boolean(erroProfissionais)}
                  >
                    {aGuardar ? 'A guardar...' : 'Guardar equipa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={equipaParaApagar !== null}
        titulo="Apagar equipa"
        mensagem={
          equipaParaApagar && (
            <>
              Apagar a Equipa <strong>{equipaParaApagar.codigo}</strong>? Se tiver histórico associado
              (membros, utentes ou voltas), fica desativada em vez de apagada.
            </>
          )
        }
        aProcessar={equipaParaApagar !== null && aApagarId === equipaParaApagar.id}
        onConfirmar={() => equipaParaApagar && apagarEquipa(equipaParaApagar)}
        onCancelar={() => setEquipaParaApagar(null)}
      />
    </div>
  );
};

export default EquipasPage;
