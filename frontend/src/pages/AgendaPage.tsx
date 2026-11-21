import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, type EventProps, type ToolbarProps, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVoltas, getVisitasAgenda } from '../services/voltaService';
import { getEquipas } from '../services/equipaService';
import { getViaturas } from '../services/viaturaService';
import { getUtentes } from '../services/utenteService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import type { Volta, EstadoVolta, VisitaAgenda, EstadoVisita } from '../types/volta';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';
import type { Utente } from '../types/utente';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import { formatarHora } from '../utils/formatarHora';
import PainelConstrucaoRota from '../components/PainelConstrucaoRota';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'pt-PT': pt } });

const MENSAGENS_PT = {
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  allDay: 'Dia inteiro',
  week: 'Semana',
  work_week: 'Semana útil',
  day: 'Dia',
  month: 'Mês',
  previous: 'Anterior',
  next: 'Seguinte',
  yesterday: 'Ontem',
  tomorrow: 'Amanhã',
  today: 'Hoje',
  agenda: 'Agenda',
  noEventsInRange: 'Não há registos neste período.',
  showMore: (total: number) => `+${total} mais`,
};

const LABEL_ESTADO_VISITA: Record<EstadoVisita, string> = {
  PENDENTE: 'Pendente',
  PLANEADA: 'Planeada',
  EM_CURSO: 'Em curso',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const COR_ESTADO_VISITA: Record<EstadoVisita, string> = {
  PENDENTE: '#6c757d',
  PLANEADA: '#0d6efd',
  EM_CURSO: '#fd7e14',
  CONCLUIDA: '#198754',
  CANCELADA: '#dc3545',
};

type VistaAgenda = 'unidade' | 'profissional' | 'utente';

interface ProfissionalOpcao {
  id: number;
  nome: string;
  funcao: string;
  equipasCodigos: string[];
}

type EventoAgenda =
  | {
      tipo: 'volta';
      id: number;
      voltaId: number;
      title: string;
      start: Date;
      end: Date;
      cor: string;
      resource: Volta;
    }
  | {
      tipo: 'visita';
      id: number;
      voltaId: number;
      title: string;
      start: Date;
      end: Date;
      cor: string;
      resource: VisitaAgenda;
    };

function EventoCalendario({ event }: EventProps<EventoAgenda>) {
  if (event.tipo === 'visita') {
    const inicio = event.resource.inicioPrevisto ?? event.resource.inicioReal;
    const fim = event.resource.fimPrevisto ?? event.resource.fimReal;
    return (
      <div className="agenda-evento">
        <div>{formatarHora(inicio)} → {formatarHora(fim)}</div>
        <div className="small text-truncate">{event.resource.utenteNome}</div>
      </div>
    );
  }

  return (
    <div className="agenda-evento">
      <div>{formatarHora(event.resource.partidaPrevista)} → {formatarHora(event.resource.regressoPrevisto)}</div>
      <div className="small text-muted">{event.resource.equipaCodigo ?? 'Sem equipa'}</div>
    </div>
  );
}

function BarraCalendario({ label, onNavigate }: ToolbarProps<EventoAgenda>) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onNavigate('PREV')}>
        <i className="bi bi-chevron-left"></i>
      </button>
      <span className="fw-medium text-capitalize">{label}</span>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onNavigate('NEXT')}>
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

const AgendaPage = () => {
  const [searchParams] = useSearchParams();
  const viaturaIdInicial = searchParams.get('viaturaId');
  const profissionalIdInicial = searchParams.get('profissionalId');
  const utenteIdInicial = searchParams.get('utenteId');

  const vistaInicial: VistaAgenda = utenteIdInicial
    ? 'utente'
    : profissionalIdInicial
      ? 'profissional'
      : 'unidade';

  const [vista, setVista] = useState<VistaAgenda>(vistaInicial);
  const [voltas, setVoltas] = useState<Volta[]>([]);
  const [visitas, setVisitas] = useState<VisitaAgenda[]>([]);
  const [voltasDoMes, setVoltasDoMes] = useState<Volta[]>([]);
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [equipaId, setEquipaId] = useState<number | undefined>();
  const [viaturaId, setViaturaId] = useState<number | undefined>(
    viaturaIdInicial ? Number(viaturaIdInicial) : undefined,
  );
  const [estadoVolta, setEstadoVolta] = useState<EstadoVolta | undefined>();
  const [profissionalId, setProfissionalId] = useState<number | undefined>(
    profissionalIdInicial ? Number(profissionalIdInicial) : undefined,
  );
  const [utenteId, setUtenteId] = useState<number | undefined>(
    utenteIdInicial ? Number(utenteIdInicial) : undefined,
  );
  const [estadoVisita, setEstadoVisita] = useState<EstadoVisita | undefined>();

  const [dataAtual, setDataAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const intervalo = useMemo(() => ({
    dataInicio: format(startOfMonth(dataAtual), 'yyyy-MM-dd'),
    dataFim: format(endOfMonth(dataAtual), 'yyyy-MM-dd'),
  }), [dataAtual]);

  const navigate = useNavigate();

  useEffect(() => {
    comAtrasoMinimo(Promise.allSettled([
      getEquipas().then(setEquipas),
      getViaturas().then(setViaturas),
      getUtentes().then(setUtentes),
    ])).finally(() => setCarregando(false));
  }, []);

  // Lista única de profissionais extraída das equipas a que o utilizador tem acesso
  const profissionais = useMemo<ProfissionalOpcao[]>(() => {
    const mapa = new Map<number, ProfissionalOpcao>();
    for (const equipa of equipas) {
      for (const membro of equipa.membros) {
        const existente = mapa.get(membro.id);
        if (existente) {
          if (!existente.equipasCodigos.includes(equipa.codigo)) {
            existente.equipasCodigos.push(equipa.codigo);
          }
        } else {
          mapa.set(membro.id, {
            id: membro.id,
            nome: membro.nome,
            funcao: membro.funcao,
            equipasCodigos: [equipa.codigo],
          });
        }
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  }, [equipas]);

  const recarregarDadosVista = useCallback(() => {
    if (vista === 'utente') {
      return getVisitasAgenda({
        ...intervalo,
        utenteId,
        estado: estadoVisita,
      })
        .then(setVisitas)
        .catch((erro) => console.error('Falha ao carregar visitas do utente:', erro));
    }

    return getVoltas({
      ...intervalo,
      equipaId: vista === 'unidade' ? equipaId : undefined,
      profissionalId: vista === 'profissional' ? profissionalId : undefined,
      viaturaId,
      estado: estadoVolta,
    })
      .then(setVoltas)
      .catch((erro) => console.error('Falha ao carregar voltas:', erro));
  }, [vista, intervalo, equipaId, profissionalId, viaturaId, estadoVolta, utenteId, estadoVisita]);

  // Sem os filtros da UI de propósito: usada só para saber que equipa/viatura
  // já está ocupada num dia, independentemente do que está selecionado nos
  // selects de filtro (senão uma equipa "escondida" pelo filtro parecia livre).
  const recarregarVoltasDoMes = useCallback(() => {
    return getVoltas(intervalo)
      .then(setVoltasDoMes)
      .catch((erro) => console.error('Falha ao carregar voltas do mês:', erro));
  }, [intervalo]);

  useEffect(() => {
    recarregarDadosVista();
  }, [recarregarDadosVista]);

  useEffect(() => {
    recarregarVoltasDoMes();
  }, [recarregarVoltasDoMes]);

  const mudarVista = (novaVista: VistaAgenda) => {
    setVista(novaVista);
    setDiaSelecionado(null);
  };

  const eventos = useMemo<EventoAgenda[]>(() => {
    if (vista === 'utente') {
      return visitas.map((visita) => ({
        tipo: 'visita',
        id: visita.visitaId,
        voltaId: visita.voltaId,
        title: visita.utenteNome,
        start: new Date(visita.inicioPrevisto ?? visita.dataVolta),
        end: new Date(visita.fimPrevisto ?? visita.inicioPrevisto ?? visita.dataVolta),
        cor: COR_ESTADO_VISITA[visita.visitaEstado] ?? '#0d6efd',
        resource: visita,
      }));
    }

    return voltas.map((volta) => ({
      tipo: 'volta',
      id: volta.id,
      voltaId: volta.id,
      title: volta.designacao ?? `Volta ${volta.id}`,
      start: new Date(volta.partidaPrevista ?? volta.data),
      end: new Date(volta.regressoPrevisto ?? volta.data),
      cor: COR_ESTADO_VOLTA[volta.estado],
      resource: volta,
    }));
  }, [vista, voltas, visitas]);

  const aoEstilizarEvento = useCallback((evento: EventoAgenda) => ({
    style: { backgroundColor: evento.cor, border: 'none' },
  }), []);

  const voltasDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return voltas.filter((volta) => isSameDay(new Date(volta.partidaPrevista ?? volta.data), diaSelecionado));
  }, [diaSelecionado, voltas]);

  const visitasDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return visitas.filter((visita) =>
      isSameDay(new Date(visita.inicioPrevisto ?? visita.dataVolta), diaSelecionado),
    );
  }, [diaSelecionado, visitas]);

  if (carregando) {
    return <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />;
  }

  const subtituloVista =
    vista === 'unidade'
      ? 'Gestão e consulta de voltas da unidade'
      : vista === 'profissional'
        ? 'Voltas atribuídas por profissional de saúde'
        : 'Visitas domiciliárias agendadas por utente';

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Calendário de Voltas</h1>
          <p className="text-muted mb-0 small">{subtituloVista}</p>
        </div>
      </div>

      {/* Separadores de perspetiva: Unidade / Profissional / Utente (RF19) */}
      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'unidade' ? 'active' : ''}`}
            onClick={() => mudarVista('unidade')}
          >
            Unidade
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'profissional' ? 'active' : ''}`}
            onClick={() => mudarVista('profissional')}
          >
            Profissional
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'utente' ? 'active' : ''}`}
            onClick={() => mudarVista('utente')}
          >
            Utente
          </button>
        </li>
      </ul>

      {/* Filtros específicos de cada vista (sem filtro de Equipas na vista Utente — RF19/RF49) */}
      <div className="d-flex flex-wrap gap-2 mb-3 agenda-filtros">
        {vista === 'unidade' && (
          <select
            className="form-select form-select-sm agenda-filtro-select"
            value={equipaId ?? ''}
            onChange={(e) => setEquipaId(e.target.value === '' ? undefined : Number(e.target.value))}
          >
            <option value="">Todas as equipas</option>
            {equipas.map((equipa) => (
              <option key={equipa.id} value={equipa.id}>
                {equipa.designacao ? `Equipa ${equipa.codigo} — ${equipa.designacao}` : `Equipa ${equipa.codigo}`}
              </option>
            ))}
          </select>
        )}

        {vista === 'profissional' && (
          <select
            className="form-select form-select-sm agenda-filtro-select"
            value={profissionalId ?? ''}
            onChange={(e) => setProfissionalId(e.target.value === '' ? undefined : Number(e.target.value))}
          >
            <option value="">Todos os profissionais</option>
            {profissionais.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome} ({prof.funcao} · Eq. {prof.equipasCodigos.join(', ')})
              </option>
            ))}
          </select>
        )}

        {(vista === 'unidade' || vista === 'profissional') && (
          <>
            <select
              className="form-select form-select-sm agenda-filtro-select"
              value={viaturaId ?? ''}
              onChange={(e) => setViaturaId(e.target.value === '' ? undefined : Number(e.target.value))}
            >
              <option value="">Todas as viaturas</option>
              {viaturas.map((viatura) => (
                <option key={viatura.id} value={viatura.id}>{viatura.matricula}</option>
              ))}
            </select>

            <select
              className="form-select form-select-sm agenda-filtro-select"
              value={estadoVolta ?? ''}
              onChange={(e) => setEstadoVolta(e.target.value === '' ? undefined : (e.target.value as EstadoVolta))}
            >
              <option value="">Todos os estados</option>
              {Object.entries(LABEL_ESTADO_VOLTA).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>{rotulo}</option>
              ))}
            </select>
          </>
        )}

        {vista === 'utente' && (
          <>
            <select
              className="form-select form-select-sm agenda-filtro-select"
              value={utenteId ?? ''}
              onChange={(e) => setUtenteId(e.target.value === '' ? undefined : Number(e.target.value))}
            >
              <option value="">Todos os utentes</option>
              {utentes.map((utente) => (
                <option key={utente.id} value={Number(utente.id)}>
                  {utente.numeroUtente} — {utente.nome}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm agenda-filtro-select"
              value={estadoVisita ?? ''}
              onChange={(e) => setEstadoVisita(e.target.value === '' ? undefined : (e.target.value as EstadoVisita))}
            >
              <option value="">Todos os estados</option>
              {Object.entries(LABEL_ESTADO_VISITA).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>{rotulo}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 bg-white p-3">
        <div className="agenda-calendar-scroll">
          <Calendar<EventoAgenda>
            localizer={localizer}
            culture="pt-PT"
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            components={{ event: EventoCalendario, toolbar: BarraCalendario }}
            eventPropGetter={aoEstilizarEvento}
            date={dataAtual}
            onNavigate={setDataAtual}
            onSelectEvent={(evento) => navigate(`/agenda/voltas/${evento.voltaId}`)}
            selectable
            onSelectSlot={(slot: SlotInfo) => setDiaSelecionado(slot.start)}
            views={['month']}
            defaultView="month"
            messages={MENSAGENS_PT}
            style={{ height: '75vh', minHeight: '600px' }}
          />
        </div>

        {/* Legenda adaptada ao tipo de entidade exibida (Volta vs. Visita) */}
        <div className="d-flex flex-wrap gap-3 mt-3 small text-muted">
          {vista === 'utente'
            ? (Object.keys(LABEL_ESTADO_VISITA) as EstadoVisita[]).map((chave) => (
                <span key={chave} className="d-flex align-items-center gap-1">
                  <span
                    className="rounded-circle d-inline-block"
                    style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VISITA[chave] }}
                  />
                  {LABEL_ESTADO_VISITA[chave]}
                </span>
              ))
            : (Object.keys(LABEL_ESTADO_VOLTA) as EstadoVolta[]).map((chave) => (
                <span key={chave} className="d-flex align-items-center gap-1">
                  <span
                    className="rounded-circle d-inline-block"
                    style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VOLTA[chave] }}
                  />
                  {LABEL_ESTADO_VOLTA[chave]}
                </span>
              ))}
        </div>
      </div>

      <Modal show={diaSelecionado !== null} onHide={() => setDiaSelecionado(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-capitalize fs-6">
            {diaSelecionado && format(diaSelecionado, "d 'de' MMMM", { locale: pt })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vista === 'utente' ? (
            visitasDoDia.length === 0 ? (
              <p className="text-muted small mb-0">
                Não existem visitas agendadas para este dia com os filtros selecionados.
              </p>
            ) : (
              visitasDoDia.map((visita) => (
                <button
                  key={visita.visitaId}
                  type="button"
                  className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent text-start py-2 border-bottom"
                  onClick={() => navigate(`/agenda/voltas/${visita.voltaId}`)}
                >
                  <div>
                    <div className="fw-medium">
                      {formatarHora(visita.inicioPrevisto)} → {formatarHora(visita.fimPrevisto)} · {visita.utenteNome}
                    </div>
                    <div className="small text-muted">
                      {visita.localNome ?? visita.localMorada ?? 'Sem morada'} · {LABEL_ESTADO_VISITA[visita.visitaEstado]}
                    </div>
                  </div>
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VISITA[visita.visitaEstado] }}
                  />
                </button>
              ))
            )
          ) : voltasDoDia.length === 0 ? (
            diaSelecionado && (
              <PainelConstrucaoRota
                data={diaSelecionado}
                equipas={equipas}
                viaturas={viaturas}
                utentes={utentes}
                voltasDoMes={voltasDoMes}
                onCriada={() => {
                  setDiaSelecionado(null);
                  recarregarDadosVista();
                  recarregarVoltasDoMes();
                }}
              />
            )
          ) : (
            voltasDoDia.map((volta) => (
              <button
                key={volta.id}
                type="button"
                className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent text-start py-2 border-bottom"
                onClick={() => navigate(`/agenda/voltas/${volta.id}`)}
              >
                <div>
                  <div className="fw-medium">{formatarHora(volta.partidaPrevista)} → {formatarHora(volta.regressoPrevisto)}</div>
                  <div className="small text-muted">{volta.equipaCodigo ?? 'Sem equipa'} · {volta.viaturaMatricula ?? 'Sem viatura'}</div>
                </div>
                <span
                  className="rounded-circle d-inline-block flex-shrink-0"
                  style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
                />
              </button>
            ))
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AgendaPage;