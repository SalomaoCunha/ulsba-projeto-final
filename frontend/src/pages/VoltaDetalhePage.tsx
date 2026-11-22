import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Ocorrencia } from '../types/ocorrencia';
import type { VoltaDetalhe, VisitaDetalhe } from '../types/volta';
import { getOcorrencias } from '../services/ocorrenciaService';
import {
  getVoltaDetalhe,
  registarHorariosReaisVisita,
  registarHorariosReaisVolta,
  confirmarVolta,
  concluirVolta,
  cancelarVisita,
} from '../services/voltaService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import { LABEL_ESTADO_VISITA, COR_ESTADO_VISITA } from '../config/estadoVisita';
import EcraCarregamento from '../components/EcraCarregamento';
import MapaPercursoVolta from '../components/MapaPercursoVolta';
import ModalConfirmacao from '../components/ModalConfirmacao';
import { formatarHora } from '../utils/formatarHora';

// Uma visita da volta "achatada" (deixa de estar agrupada por paragem) e
// enriquecida com a informação da paragem a que pertence — usada para
// construir a lista plana de visitas mostrada na coluna 1.
interface VisitaComLocal extends VisitaDetalhe {
  paragemOrdem: number;
  localNome: string | null;
  localMorada: string;
}

// Extrai só a parte HH:MM de uma data/hora ISO, para preencher um input
// type="time". Devolve '' se a data for nula/inválida (ex.: horário real
// ainda não registado).
function extrairHoraInput(iso?: string | null): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const h = String(data.getHours()).padStart(2, '0');
  const m = String(data.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Combina a data da volta (yyyy-MM-dd) com uma hora HH:MM vinda de um input,
// devolvendo a data/hora completa em ISO (hora local do browser, convertida
// para UTC pelo toISOString). Devolve null se a hora estiver vazia ou for
// inválida, para distinguir "campo não preenchido" de uma hora real.
function montarIsoLocal(dataVolta: string, horaHHMM: string): string | null {
  if (!horaHHMM.trim()) return null;
  const dt = new Date(`${dataVolta}T${horaHHMM}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

// Formata uma duração em minutos como "Xh Ym" (omite as horas quando são 0,
// omite os minutos quando são 0 e há horas). Devolve "—" quando não há dado.
function formatarDuracao(minutos?: number | null): string {
  if (minutos === null || minutos === undefined) return '—';
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  if (horas <= 0) return `${mins} min`;
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

// Página de detalhe de uma volta: mostra o percurso planeado (paragens e
// visitas), o estado da volta no ciclo de vida RASCUNHO → CONFIRMADA →
// CONCLUIDA (ou CANCELADA), permite confirmar/concluir a volta, registar os
// horários reais (da volta e de cada visita — com propagação automática de
// atrasos para as visitas seguintes), cancelar visitas individuais (com
// motivo obrigatório — RF29) e consultar as ocorrências registadas.
const VoltaDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volta, setVolta] = useState<VoltaDetalhe | null>(null);
  const [ocorrenciasGerais, setOcorrenciasGerais] = useState<Ocorrencia[]>([]);
  const [ocorrenciasPorVisita, setOcorrenciasPorVisita] = useState<Record<number, Ocorrencia[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [visitaSelecionadaId, setVisitaSelecionadaId] = useState<number | null>(null);

  // Inputs de horários reais da volta
  const [partidaRealHora, setPartidaRealHora] = useState('');
  const [regressoRealHora, setRegressoRealHora] = useState('');
  const [aGuardarVolta, setAGuardarVolta] = useState(false);

  // Inputs de horários reais da visita selecionada
  const [visitaInicioRealHora, setVisitaInicioRealHora] = useState('');
  const [visitaFimRealHora, setVisitaFimRealHora] = useState('');
  const [aGuardarVisita, setAGuardarVisita] = useState(false);

  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [aAtualizarEstado, setAAtualizarEstado] = useState(false);

  // Cancelar visita (exige motivo — RF29)
  const [visitaParaCancelar, setVisitaParaCancelar] = useState<VisitaComLocal | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [aCancelarVisita, setACancelarVisita] = useState(false);

  // Carrega o detalhe completo da volta pelo id da rota. Ao chegar, inicializa
  // os inputs de horário real da volta a partir dos valores já guardados e
  // seleciona por omissão a primeira visita da primeira paragem.
  useEffect(() => {
    getVoltaDetalhe(Number(id))
      .then((dados) => {
        setVolta(dados);
        setPartidaRealHora(extrairHoraInput(dados.partidaReal));
        setRegressoRealHora(extrairHoraInput(dados.regressoReal));
        const primeira = dados.paragens[0]?.visitas[0];
        setVisitaSelecionadaId(primeira ? primeira.visitaId : null);
      })
      .catch((erro) => console.error('Falha ao carregar volta', erro))
      .finally(() => setCarregando(false));
  }, [id]);

  // Depois de ter a volta carregada (ou sempre que ela é substituída, p.ex.
  // depois de confirmar/concluir/registar horários), vai buscar tanto as
  // ocorrências gerais da volta como as ocorrências de cada visita
  // individualmente, agrupando-as num mapa por visitaId para acesso rápido.
  useEffect(() => {
    if (!volta) return;

    const idsDasVisitas = volta.paragens.flatMap((paragem) =>
      paragem.visitas.map((visita) => visita.visitaId),
    );

    getOcorrencias({ voltaId: volta.id })
      .then(setOcorrenciasGerais)
      .catch((erro) => console.error('Falha ao carregar ocorrências da volta:', erro));

    Promise.all(idsDasVisitas.map((visitaId) => getOcorrencias({ visitaId })))
      .then((resultados) => {
        const mapa: Record<number, Ocorrencia[]> = {};
        idsDasVisitas.forEach((visitaId, indice) => {
          mapa[visitaId] = resultados[indice];
        });
        setOcorrenciasPorVisita(mapa);
      })
      .catch((erro) => console.error('Falha ao carregar ocorrências das visitas:', erro));
  }, [volta]);

  // "Achata" a estrutura paragens → visitas numa lista única de visitas, cada
  // uma já com a informação da sua paragem anexada — mais simples de percorrer
  // na coluna 1 (lista) e para encontrar a visita selecionada.
  const visitas: VisitaComLocal[] = volta
    ? volta.paragens.flatMap((paragem) =>
        paragem.visitas.map((visita) => ({
          ...visita,
          paragemOrdem: paragem.ordem,
          localNome: paragem.localNome,
          localMorada: paragem.localMorada,
        })),
      )
    : [];

  // Objeto completo da visita atualmente selecionada na coluna 1 (ou null se
  // a lista ainda estiver vazia).
  const visitaSelecionada = visitas.find((v) => v.visitaId === visitaSelecionadaId) ?? null;

  // Ajusta os campos de hora real quando a visita selecionada muda — durante o
  // render (não num useEffect), como o React recomenda para "adjusting state
  // when a prop changes", para não disparar um ciclo extra de render.
  // A chave inclui o id da visita e os próprios horários reais (não só o id)
  // porque "volta" é substituída por um novo objeto sempre que se regista um
  // horário — sem incluir inicioReal/fimReal na chave, guardar o horário da
  // visita selecionada não faria os inputs refletir o valor recém-guardado.
  const chaveHoras = visitaSelecionada
    ? `${visitaSelecionada.visitaId}:${visitaSelecionada.inicioReal ?? ''}:${visitaSelecionada.fimReal ?? ''}`
    : '';
  const [chaveHorasAplicada, setChaveHorasAplicada] = useState('');
  if (chaveHoras !== chaveHorasAplicada) {
    setChaveHorasAplicada(chaveHoras);
    setVisitaInicioRealHora(visitaSelecionada ? extrairHoraInput(visitaSelecionada.inicioReal) : '');
    setVisitaFimRealHora(visitaSelecionada ? extrairHoraInput(visitaSelecionada.fimReal) : '');
  }

  // Regista a hora real de saída e/ou de regresso da volta. Pelo menos uma
  // das duas tem de estar preenchida. O backend recalcula automaticamente os
  // horários previstos das visitas seguintes e do regresso quando a saída
  // real é mais tarde do que a prevista (ver mensagem de sucesso abaixo).
  const handleGuardarHorariosVolta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volta) return;
    setMensagemErro(null);
    setMensagemSucesso(null);

    const partidaIso = montarIsoLocal(volta.data, partidaRealHora);
    const regressoIso = montarIsoLocal(volta.data, regressoRealHora);

    if (!partidaIso && !regressoIso) {
      setMensagemErro('Indique a hora de saída real ou de regresso real.');
      return;
    }

    setAGuardarVolta(true);
    try {
      const atualizada = await registarHorariosReaisVolta(volta.id, {
        partidaReal: partidaIso,
        regressoReal: regressoIso,
      });
      setVolta(atualizada);
      setPartidaRealHora(extrairHoraInput(atualizada.partidaReal));
      setRegressoRealHora(extrairHoraInput(atualizada.regressoReal));
      setMensagemSucesso(
        atualizada.resumo && atualizada.resumo.atrasoSaidaMin > 0
          ? `Saída real registada (+${formatarDuracao(atualizada.resumo.atrasoSaidaMin)}). Os horários previstos seguintes e o regresso foram ajustados automaticamente.`
          : 'Horários reais da volta guardados com sucesso.',
      );
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível guardar os horários da volta.');
    } finally {
      setAGuardarVolta(false);
    }
  };

  // Regista a hora real de início e/ou fim da visita selecionada. Tal como
  // nos horários da volta, um atraso real propaga-se às visitas seguintes e
  // ao regresso previsto — por isso a volta inteira é substituída pela
  // resposta do backend, não só a visita alterada.
  const handleGuardarHorariosVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volta || !visitaSelecionada) return;
    setMensagemErro(null);
    setMensagemSucesso(null);

    const inicioIso = montarIsoLocal(volta.data, visitaInicioRealHora);
    const fimIso = montarIsoLocal(volta.data, visitaFimRealHora);

    if (!inicioIso && !fimIso) {
      setMensagemErro('Indique o início real ou o fim real da visita.');
      return;
    }

    setAGuardarVisita(true);
    try {
      const atualizada = await registarHorariosReaisVisita(volta.id, visitaSelecionada.visitaId, {
        inicioReal: inicioIso,
        fimReal: fimIso,
      });
      setVolta(atualizada);
      setMensagemSucesso(
        `Horários reais de ${visitaSelecionada.utenteNome} guardados. Eventuais atrasos foram propagados para as visitas seguintes e para o regresso previsto.`,
      );
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível guardar os horários da visita.');
    } finally {
      setAGuardarVisita(false);
    }
  };

  // Avança a volta de RASCUNHO para CONFIRMADA. Só aparece o botão
  // correspondente (ver JSX mais abaixo) enquanto a volta está em RASCUNHO.
  const handleConfirmarVolta = async () => {
    if (!volta) return;
    setMensagemErro(null);
    setMensagemSucesso(null);
    setAAtualizarEstado(true);
    try {
      const atualizada = await confirmarVolta(volta.id);
      setVolta(atualizada);
      setMensagemSucesso('Volta confirmada com sucesso.');
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível confirmar a volta.');
    } finally {
      setAAtualizarEstado(false);
    }
  };

  // Marca a volta como CONCLUIDA (fim do ciclo de vida, a par de CANCELADA).
  // O backend confirma a volta automaticamente se ainda estiver em RASCUNHO,
  // e fecha com o horário previsto qualquer visita que ainda não tenha sido
  // registada manualmente nem cancelada — ver o texto do botão "Marcar como
  // feita" no JSX, que explicita este comportamento ao utilizador.
  const handleConcluirVolta = async () => {
    if (!volta) return;
    setMensagemErro(null);
    setMensagemSucesso(null);
    setAAtualizarEstado(true);
    try {
      const atualizada = await concluirVolta(volta.id);
      setVolta(atualizada);
      setMensagemSucesso('Volta marcada como concluída.');
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível concluir a volta.');
    } finally {
      setAAtualizarEstado(false);
    }
  };

  // Cancela a visita selecionada no modal de confirmação. O motivo é
  // obrigatório (RF29) — o próprio botão de confirmar no modal fica
  // desativado enquanto o campo de motivo estiver vazio (ver
  // confirmarDesabilitado no JSX do ModalConfirmacao), mas a verificação
  // repete-se aqui como salvaguarda.
  const handleCancelarVisita = async () => {
    if (!volta || !visitaParaCancelar || !motivoCancelamento.trim()) return;
    setMensagemErro(null);
    setMensagemSucesso(null);
    setACancelarVisita(true);
    try {
      const atualizada = await cancelarVisita(volta.id, visitaParaCancelar.visitaId, motivoCancelamento.trim());
      setVolta(atualizada);
      setMensagemSucesso(`Visita de ${visitaParaCancelar.utenteNome} cancelada.`);
      setVisitaParaCancelar(null);
      setMotivoCancelamento('');
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível cancelar a visita.');
    } finally {
      setACancelarVisita(false);
    }
  };

  if (carregando) {
    return <EcraCarregamento mensagem="A carregar volta..." />;
  }

  if (!volta) {
    return <div>Volta não encontrada.</div>;
  }

  const resumo = volta.resumo;
  // Mostra a distância mais fiável disponível, por ordem de preferência:
  // real (registada) > estimada (planeamento) > soma das distâncias entre
  // paragens (cálculo de recurso), ou null se nenhuma estiver disponível.
  const distanciaMostrada = volta.distanciaRealKm ?? volta.distanciaEstimadaKm ?? resumo?.distanciaParagensSomaKm ?? null;

  // Legenda de cores de prioridade/urgência mostrada junto ao mapa — usa um
  // Map para eliminar duplicados (várias visitas podem partilhar a mesma
  // urgência) mantendo só um par designação/cor por urgência distinta.
  const legendaPrioridades = Array.from(
    new Map(
      visitas
        .filter((v) => v.urgenciaCor && v.urgenciaDesignacao)
        .map((v) => [v.urgenciaDesignacao, v.urgenciaCor as string]),
    ).entries(),
  );

  return (
    <div className="h-100 d-flex flex-column align-items-center overflow-auto py-2 py-md-3">
      <div className="card shadow border-0 w-100 ulsba-volta-caixa">
        {/* Cabeçalho */}
        <div className="card-header bg-white border-bottom p-3">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="h5 fw-bold text-dark mb-0">
                {volta.designacao ?? `Volta #${volta.id}`}
              </h1>
              <span
                className="badge px-3 py-2 rounded-pill"
                style={{ backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
              >
                {LABEL_ESTADO_VOLTA[volta.estado]}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              {/* Ciclo de vida da volta: RASCUNHO → CONFIRMADA → CONCLUIDA
                  (ou CANCELADA). O botão "Confirmar volta" só aparece em
                  RASCUNHO; o botão "Marcar como feita" aparece em qualquer
                  estado que não seja já final (CONCLUIDA/CANCELADA) e também
                  serve para confirmar a volta automaticamente se ainda não
                  tiver sido confirmada (ver texto do title). */}
              {volta.estado === 'RASCUNHO' && (
                <button
                  className="btn btn-sm btn-primary d-print-none"
                  onClick={handleConfirmarVolta}
                  disabled={aAtualizarEstado}
                >
                  <i className="bi bi-check2-square"></i>
                  <span className="d-none d-sm-inline"> {aAtualizarEstado ? 'A confirmar...' : 'Confirmar volta'}</span>
                </button>
              )}
              {volta.estado !== 'CONCLUIDA' && volta.estado !== 'CANCELADA' && (
                <button
                  className="btn btn-sm btn-success d-print-none"
                  onClick={handleConcluirVolta}
                  disabled={aAtualizarEstado}
                  title="Confirma a volta se necessário e conclui, com o horário previsto, qualquer visita ainda em falta"
                >
                  <i className="bi bi-flag-fill"></i>
                  <span className="d-none d-sm-inline"> {aAtualizarEstado ? 'A concluir...' : 'Marcar como feita'}</span>
                </button>
              )}
              <button className="btn btn-sm btn-outline-secondary d-print-none" onClick={() => window.print()}>
                <i className="bi bi-printer"></i>
                <span className="d-none d-sm-inline"> Imprimir relatório</span>
              </button>
              <button
                className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center d-print-none"
                style={{ width: '32px', height: '32px' }}
                title="Voltar ao calendário"
                onClick={() => navigate('/agenda')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <p className="text-muted small mb-3 text-capitalize">
            {new Date(volta.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Aviso de regresso a Beja (aviso, não bloqueio) */}
          {resumo?.comprometeRegressoBeja && resumo.avisoRegressoBeja && (
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-6 flex-shrink-0"></i>
              <div>
                <strong>Regresso a Beja comprometido:</strong> {resumo.avisoRegressoBeja}
              </div>
            </div>
          )}

          {/* Alertas de coerência de horários ou distâncias */}
          {resumo && resumo.alertasCoerencia.length > 0 && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              <div className="fw-semibold mb-1">
                <i className="bi bi-shield-exclamation me-1"></i>
                Incoerências detetadas nos horários ou totais da volta:
              </div>
              <ul className="mb-0 ps-3">
                {resumo.alertasCoerencia.map((alerta, idx) => (
                  <li key={idx}>{alerta}</li>
                ))}
              </ul>
            </div>
          )}

          {mensagemErro && (
            <div className="alert alert-danger py-2 px-3 small mb-3 d-flex justify-content-between align-items-center">
              <span>{mensagemErro}</span>
              <button type="button" className="btn-close btn-sm" onClick={() => setMensagemErro(null)} />
            </div>
          )}

          {mensagemSucesso && (
            <div className="alert alert-success py-2 px-3 small mb-3 d-flex justify-content-between align-items-center">
              <span>{mensagemSucesso}</span>
              <button type="button" className="btn-close btn-sm" onClick={() => setMensagemSucesso(null)} />
            </div>
          )}

          {/* Indicadores e Totais Coerentes */}
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-people" label="Equipa" valor={volta.equipaCodigo ? `Equipa ${volta.equipaCodigo}` : 'Sem equipa'} />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem icon="bi-truck" label="Viatura" valor={volta.viaturaMatricula ?? 'Sem viatura'} />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-clock"
                label="Horário previsto"
                valor={`${formatarHora(volta.partidaPrevista)} → ${formatarHora(volta.regressoPrevisto)}`}
              />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-signpost-2"
                label="Distância"
                valor={distanciaMostrada !== null ? `${distanciaMostrada} km` : 'Por calcular'}
              />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-hourglass-split"
                label="Duração prevista da volta"
                valor={formatarDuracao(resumo?.duracaoPrevistaVoltaMin)}
              />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-clipboard2-pulse"
                label="Tempo em visitas (prev. / real)"
                valor={`${formatarDuracao(resumo?.duracaoPrevistaVisitasMin)} / ${formatarDuracao(resumo?.duracaoRealVisitasMin)}`}
              />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-geo-alt"
                label="Deslocação estimada"
                valor={formatarDuracao(resumo?.tempoDeslocacaoPrevistoMin)}
              />
            </div>
            <div className="col-6 col-md-3">
              <DetalheItem
                icon="bi-flag"
                label="Limite regresso a Beja"
                valor={resumo?.horaLimiteRegressoBeja ?? '16:00'}
              />
            </div>
          </div>

          {/* Registo de Saída Real e Regresso Real da Volta — só faz sentido
              enquanto a volta ainda não está fechada; depois de concluída ou
              cancelada, os horários reais ficam decididos e mostram-se só como
              leitura mais acima. */}
          {volta.estado !== 'CONCLUIDA' && volta.estado !== 'CANCELADA' && (
            <form onSubmit={handleGuardarHorariosVolta} className="bg-light rounded-3 p-2 px-3 mt-3 d-print-none">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-4">
                  <div className="small fw-semibold text-dark">
                    <i className="bi bi-stopwatch me-1 text-success"></i>
                    Registo real da volta
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Saída posterior à prevista ajusta automaticamente visitas e regresso.
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label mb-1 text-muted" style={{ fontSize: '0.72rem' }}>Saída real</label>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={partidaRealHora}
                    onChange={(e) => setPartidaRealHora(e.target.value)}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label mb-1 text-muted" style={{ fontSize: '0.72rem' }}>Regresso real</label>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={regressoRealHora}
                    onChange={(e) => setRegressoRealHora(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-2">
                  <button type="submit" className="btn btn-success btn-sm w-100" disabled={aGuardarVolta}>
                    {aGuardarVolta ? 'A guardar...' : 'Atualizar'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Corpo: 3 colunas no desktop, empilhado em mobile */}
        <div className="card-body p-3">
          <div className="row g-3">
            {/* Coluna 1 — lista de visitas da volta, por ordem de paragem;
                clicar numa visita seleciona-a para a coluna 2 (detalhe). */}
            <div className="col-12 col-lg-4">
              <h6 className="fw-bold small text-uppercase text-muted mb-2">
                Visitas ({visitas.length})
              </h6>
              <div className="d-flex flex-column gap-2">
                {visitas.map((visita, indice) => (
                  <button
                    key={visita.visitaId}
                    onClick={() => setVisitaSelecionadaId(visita.visitaId)}
                    className={`btn text-start p-2 rounded-3 border ${visita.visitaId === visitaSelecionadaId ? 'border-success bg-success bg-opacity-10' : 'border-light bg-white'}`}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                        style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: visita.urgenciaCor ?? '#6c757d' }}
                      >
                        {indice + 1}
                      </span>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-medium text-dark text-truncate">{visita.utenteNome}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                          {visita.localNome ?? visita.localMorada}
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {formatarHora(visita.inicioPrevisto)} → {formatarHora(visita.fimPrevisto)}
                          </span>
                          <span
                            className="badge rounded-pill"
                            style={{ backgroundColor: COR_ESTADO_VISITA[visita.visitaEstado], fontSize: '0.65rem' }}
                          >
                            {LABEL_ESTADO_VISITA[visita.visitaEstado] ?? visita.visitaEstado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coluna 2 — detalhe da visita selecionada */}
            <div className="col-12 col-lg-4">
              {!visitaSelecionada ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small p-4">
                  Sem visitas para mostrar.
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h6 className="fw-bold text-dark mb-0">{visitaSelecionada.utenteNome}</h6>
                    {visitaSelecionada.urgenciaDesignacao && (
                      <span
                        className="ulsba-pill"
                        style={{ backgroundColor: `${visitaSelecionada.urgenciaCor}22`, color: visitaSelecionada.urgenciaCor ?? undefined }}
                      >
                        {visitaSelecionada.urgenciaDesignacao}
                      </span>
                    )}
                  </div>
                  <p className="text-muted small mb-3">{visitaSelecionada.localNome ?? visitaSelecionada.localMorada}</p>

                  <h6 className="fw-bold small text-uppercase text-muted mb-2">
                    <i className="bi bi-clock me-1"></i> Horários da visita
                  </h6>
                  <table className="table table-sm mb-3">
                    <thead>
                      <tr className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <th></th>
                        <th>Previsto</th>
                        <th>Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>Início</td>
                        <td>{formatarHora(visitaSelecionada.inicioPrevisto)}</td>
                        <td>{formatarHora(visitaSelecionada.inicioReal)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>Fim</td>
                        <td>{formatarHora(visitaSelecionada.fimPrevisto)}</td>
                        <td>{formatarHora(visitaSelecionada.fimReal)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Registo real da visita (propaga atraso para visitas seguintes) — opcional:
                      "Marcar como feita" na volta já fecha sozinha qualquer visita em falta
                      com o horário previsto; isto só é preciso para quem queira registar um
                      horário real diferente. Some assim que a volta ou a própria visita já
                      estiverem fechadas — nessa altura os horários reais já estão decididos e
                      só fazem sentido como leitura (tabela Previsto/Real acima). */}
                  {volta.estado !== 'CONCLUIDA' &&
                    volta.estado !== 'CANCELADA' &&
                    visitaSelecionada.visitaEstado !== 'CONCLUIDA' &&
                    visitaSelecionada.visitaEstado !== 'CANCELADA' && (
                      <form onSubmit={handleGuardarHorariosVisita} className="bg-light rounded-3 p-2 mb-3 d-print-none">
                        <div className="row g-2 align-items-end">
                          <div className="col-6">
                            <label className="form-label mb-1 text-muted" style={{ fontSize: '0.72rem' }}>Início real</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={visitaInicioRealHora}
                              onChange={(e) => setVisitaInicioRealHora(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label mb-1 text-muted" style={{ fontSize: '0.72rem' }}>Fim real</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={visitaFimRealHora}
                              onChange={(e) => setVisitaFimRealHora(e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <button type="submit" className="btn btn-outline-success btn-sm w-100" disabled={aGuardarVisita}>
                              <i className="bi bi-check2-circle me-1"></i>
                              {aGuardarVisita ? 'A atualizar...' : 'Guardar horários reais da visita'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                  {/* Mesma condição de guarda do formulário de horários reais
                      acima: só se pode cancelar enquanto a volta e a própria
                      visita ainda estiverem "abertas". Abre o modal de
                      confirmação que exige o motivo (RF29). */}
                  {volta.estado !== 'CONCLUIDA' &&
                    volta.estado !== 'CANCELADA' &&
                    visitaSelecionada.visitaEstado !== 'CONCLUIDA' &&
                    visitaSelecionada.visitaEstado !== 'CANCELADA' && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100 mb-3 d-print-none"
                        onClick={() => setVisitaParaCancelar(visitaSelecionada)}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancelar visita
                      </button>
                    )}

                  <h6 className="fw-bold small text-uppercase text-muted mb-2">
                    <i className="bi bi-chat-left-text me-1"></i> Ocorrências da visita
                  </h6>
                  {(ocorrenciasPorVisita[visitaSelecionada.visitaId] ?? []).length === 0 ? (
                    <p className="text-muted small">Sem ocorrências registadas.</p>
                  ) : (
                    (ocorrenciasPorVisita[visitaSelecionada.visitaId] ?? []).map((ocorrencia) => (
                      <div key={ocorrencia.id} className="ulsba-nota mb-2">
                        <p className="small mb-1">{ocorrencia.texto}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                          {ocorrencia.tipoDesignacao} · {ocorrencia.autorNome}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Coluna 3 — mapa + legenda */}
            <div className="col-12 col-lg-4 d-print-none">
              <h6 className="fw-bold small text-uppercase text-muted mb-2">
                <i className="bi bi-map me-1"></i> Mapa do percurso
              </h6>

              {legendaPrioridades.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {legendaPrioridades.map(([designacao, cor]) => (
                    <span key={designacao} className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
                      <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: cor }} />
                      {designacao}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-3 overflow-hidden border">
                {/* key força remonte ao mudar de volta: o MapContainer do
                    Leaflet só usa center/zoom na montagem inicial — sem
                    isto, navegar de uma volta para outra sem recarregar a
                    página deixava o mapa parado no sítio da volta anterior. */}
                <MapaPercursoVolta key={volta.id} paragens={volta.paragens} />
              </div>
            </div>
          </div>

          {/* Ocorrências gerais da volta (não associadas a uma visita em
              concreto) — largura toda, por baixo das 3 colunas */}
          <hr className="my-3" />
          <h6 className="fw-bold small text-uppercase text-muted mb-2">
            <i className="bi bi-exclamation-circle me-1"></i> Ocorrências gerais da volta
          </h6>
          {ocorrenciasGerais.length === 0 ? (
            <p className="text-muted small mb-0">Sem ocorrências registadas.</p>
          ) : (
            <div className="row g-2">
              {ocorrenciasGerais.map((ocorrencia) => (
                <div key={ocorrencia.id} className="col-12 col-md-6">
                  <div className="ulsba-nota h-100">
                    <p className="small mb-1">{ocorrencia.texto}</p>
                    <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                      {ocorrencia.tipoDesignacao} · {ocorrencia.autorNome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="card-footer bg-white d-print-none p-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/agenda')}>
            <i className="bi bi-arrow-left"></i> Voltar ao calendário
          </button>
        </div>
      </div>

      {/* Modal de confirmação de cancelamento de visita — o botão de
          confirmar fica desativado enquanto não houver motivo escrito
          (confirmarDesabilitado), por ser obrigatório (RF29). */}
      <ModalConfirmacao
        aberto={visitaParaCancelar !== null}
        titulo="Cancelar visita"
        mensagem={
          visitaParaCancelar && (
            <>
              Cancelar a visita de <strong>{visitaParaCancelar.utenteNome}</strong>? Indica o motivo
              (obrigatório).
            </>
          )
        }
        textoConfirmar="Cancelar visita"
        textoAProcessar="A cancelar..."
        aProcessar={aCancelarVisita}
        confirmarDesabilitado={!motivoCancelamento.trim()}
        onConfirmar={handleCancelarVisita}
        onCancelar={() => {
          setVisitaParaCancelar(null);
          setMotivoCancelamento('');
        }}
      >
        <textarea
          className="form-control form-control-sm mt-2"
          rows={2}
          placeholder="Ex: Utente indisponível, internamento, pedido de adiamento..."
          value={motivoCancelamento}
          onChange={(e) => setMotivoCancelamento(e.target.value)}
        />
      </ModalConfirmacao>
    </div>
  );
};

// Componente auxiliar de apresentação: um ícone num círculo + rótulo/valor,
// usado nos indicadores do cabeçalho (equipa, viatura, horários, distância, etc.).
const DetalheItem = ({ icon, label, valor }: { icon: string; label: string; valor: string }) => (
  <div className="d-flex align-items-center gap-2">
    <div
      className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: '32px', height: '32px' }}
    >
      <i className={`bi ${icon}`}></i>
    </div>
    <div style={{ minWidth: 0 }}>
      <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>{label}</p>
      <p className="fw-medium text-dark mb-0 text-truncate" style={{ fontSize: '0.85rem' }}>{valor}</p>
    </div>
  </div>
);

export default VoltaDetalhePage;