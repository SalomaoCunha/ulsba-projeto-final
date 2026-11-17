import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, type EventProps, type ToolbarProps, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVoltas } from '../services/voltaService';
import { getEquipas } from '../services/equipaService';
import { getViaturas } from '../services/viaturaService';
import { getUtentes } from '../services/utenteService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import type { Volta, EstadoVolta } from '../types/volta';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';
import type { Utente } from '../types/utente';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import PainelConstrucaoRota from '../components/PainelConstrucaoRota';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'pt-PT': pt } });

const MENSAGENS_PT = {
  date: 'Data',
  time: 'Hora',
  event: 'Volta',
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
  noEventsInRange: 'Não há voltas neste período.',
  showMore: (total: number) => `+${total} mais`,
};

interface EventoVolta {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Volta;
}

function formatarHora(hora: string | null) {
  return hora ? new Date(hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—';
}

function EventoCalendario({ event }: EventProps<EventoVolta>) {
  return (
    <div className="agenda-evento">
      <div>{formatarHora(event.resource.partidaPrevista)} → {formatarHora(event.resource.regressoPrevisto)}</div>
      <div className="small text-muted">{event.resource.equipaCodigo}</div>
    </div>
  );
}

function BarraCalendario({ label, onNavigate }: ToolbarProps<EventoVolta>) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
      <button className="btn btn-sm btn-outline-secondary" onClick={() => onNavigate('PREV')}>
        <i className="bi bi-chevron-left"></i>
      </button>
      <span className="fw-medium text-capitalize">{label}</span>
      <button className="btn btn-sm btn-outline-secondary" onClick={() => onNavigate('NEXT')}>
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

const AgendaPage = () => {
  const [voltas, setVoltas] = useState<Volta[]>([]);
  const [voltasDoMes, setVoltasDoMes] = useState<Volta[]>([]);
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [searchParams] = useSearchParams();
  const viaturaIdInicial = searchParams.get('viaturaId');

  const [equipaId, setEquipaId] = useState<number | undefined>();
  const [viaturaId, setViaturaId] = useState<number | undefined>(
    viaturaIdInicial ? Number(viaturaIdInicial) : undefined,
  );
  const [estado, setEstado] = useState<EstadoVolta | undefined>();

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

  const recarregarVoltas = useCallback(() => {
    return getVoltas({ ...intervalo, equipaId, viaturaId, estado })
      .then(setVoltas)
      .catch((erro) => console.error('Falha ao carregar voltas:', erro));
  }, [intervalo, equipaId, viaturaId, estado]);

  // Sem os filtros da UI de propósito: usada só para saber que equipa/viatura
  // já está ocupada num dia, independentemente do que está selecionado nos
  // selects de filtro (senão uma equipa "escondida" pelo filtro parecia livre).
  const recarregarVoltasDoMes = useCallback(() => {
    return getVoltas(intervalo)
      .then(setVoltasDoMes)
      .catch((erro) => console.error('Falha ao carregar voltas do mês:', erro));
  }, [intervalo]);

  useEffect(() => {
    recarregarVoltas();
  }, [recarregarVoltas]);

  useEffect(() => {
    recarregarVoltasDoMes();
  }, [recarregarVoltasDoMes]);

  const eventos = useMemo<EventoVolta[]>(() => {
    return voltas.map((volta) => ({
    id: volta.id,
    title: volta.designacao ?? `Volta ${volta.id}`,
    start: new Date(volta.partidaPrevista ?? volta.data),
    end: new Date(volta.regressoPrevisto ?? volta.data),
    resource: volta,
  }));
  }, [voltas]);

  const aoEstilizarEvento = useCallback((evento: EventoVolta) => ({
    style: { backgroundColor: COR_ESTADO_VOLTA[evento.resource.estado], border: 'none' },
  }), []);

  const voltasDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return voltas.filter((volta) => isSameDay(new Date(volta.partidaPrevista ?? volta.data), diaSelecionado));
  }, [diaSelecionado, voltas]);

  if (carregando) {
    return <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />;
  }

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Calendário de Voltas</h1>
          <p className="text-muted mb-0 small">Gestão e consulta de voltas</p>
        </div>
      </div>

      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button className="nav-link active" disabled>Unidade</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" disabled title="Em breve">Profissional</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" disabled title="Em breve">Utente</button>
        </li>
      </ul>

      <div className="d-flex flex-wrap gap-2 mb-3 agenda-filtros">
        <select
          className="form-select form-select-sm agenda-filtro-select"
          value={equipaId ?? ''}
          onChange={(e) => setEquipaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Todas as equipas</option>
          {equipas.map((equipa) => (
            <option key={equipa.id} value={equipa.id}>{equipa.designacao}</option>
          ))}
        </select>

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
          value={estado ?? ''}
          onChange={(e) => setEstado(e.target.value === '' ? undefined : (e.target.value as EstadoVolta))}
        >
          <option value="">Todos os estados</option>
          {Object.entries(LABEL_ESTADO_VOLTA).map(([chave, rotulo]) => (
            <option key={chave} value={chave}>{rotulo}</option>
          ))}
        </select>
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 bg-white p-3">
        <div className="agenda-calendar-scroll">
          <Calendar
            localizer={localizer}
            culture="pt-PT"
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            components={{ event: EventoCalendario, toolbar: BarraCalendario }}
            eventPropGetter={aoEstilizarEvento}
            date={dataAtual}
            onNavigate={setDataAtual}
            onSelectEvent={(evento) => navigate(`/agenda/voltas/${evento.id}`)}
            selectable
            onSelectSlot={(slot: SlotInfo) => setDiaSelecionado(slot.start)}
            views={['month']}
            defaultView="month"
            messages={MENSAGENS_PT}
            style={{ height: '75vh', minHeight: '600px' }}
          />
        </div>

        <div className="d-flex flex-wrap gap-3 mt-3 small text-muted">
          {Object.keys(LABEL_ESTADO_VOLTA).map((chave) => (
            <span key={chave} className="d-flex align-items-center gap-1">
              <span
                className="rounded-circle d-inline-block"
                style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VOLTA[chave as EstadoVolta] }}
              />
              {LABEL_ESTADO_VOLTA[chave as EstadoVolta]}
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
          {voltasDoDia.length === 0 ? (
            diaSelecionado && (
              <PainelConstrucaoRota
                data={diaSelecionado}
                equipas={equipas}
                viaturas={viaturas}
                utentes={utentes}
                voltasDoMes={voltasDoMes}
                onCriada={() => {
                  setDiaSelecionado(null);
                  recarregarVoltas();
                  recarregarVoltasDoMes();
                }}
              />
            )
          ) : (
            voltasDoDia.map((volta) => (
              <button
                key={volta.id}
                className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent text-start py-2 border-bottom"
                onClick={() => navigate(`/agenda/voltas/${volta.id}`)}
              >
                <div>
                  <div className="fw-medium">{formatarHora(volta.partidaPrevista)} → {formatarHora(volta.regressoPrevisto)}</div>
                  <div className="small text-muted">{volta.equipaCodigo} · {volta.viaturaMatricula ?? 'Sem viatura'}</div>
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
