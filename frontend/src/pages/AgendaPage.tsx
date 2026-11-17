import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type EventProps, type ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { getVoltas } from '../services/voltaService';
import { getEquipas } from '../services/equipaService';
import { getViaturas } from '../services/viaturaService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import type { Volta, EstadoVolta } from '../types/volta';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'pt-PT': pt } });

interface EventoVolta {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Volta;
}

function EventoCalendario({ event }: EventProps<EventoVolta>) {
  const formatarHora = (hora: string | null) =>
    hora ? new Date(hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div>
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
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [equipaId, setEquipaId] = useState<number | undefined>();
  const [viaturaId, setViaturaId] = useState<number | undefined>();
  const [estado, setEstado] = useState<EstadoVolta | undefined>();

  const [dataAtual, setDataAtual] = useState(new Date());

  const intervalo = useMemo(() => ({
    dataInicio: format(startOfMonth(dataAtual), 'yyyy-MM-dd'),
    dataFim: format(endOfMonth(dataAtual), 'yyyy-MM-dd'),
  }), [dataAtual]);

  const navigate = useNavigate();

  useEffect(() => {
    comAtrasoMinimo(Promise.allSettled([
      getEquipas().then(setEquipas),
      getViaturas().then(setViaturas),
    ])).finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    getVoltas({ ...intervalo, equipaId, viaturaId, estado })
      .then(setVoltas)
      .catch((erro) => console.error('Falha ao carregar voltas:', erro));
  }, [intervalo, equipaId, viaturaId, estado]);

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

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          value={equipaId ?? ''}
          onChange={(e) => setEquipaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Todas as equipas</option>
          {equipas.map((equipa) => (
            <option key={equipa.id} value={equipa.id}>{equipa.designacao}</option>
          ))}
        </select>

        <select
          className="form-select form-select-sm"
          value={viaturaId ?? ''}
          onChange={(e) => setViaturaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Todas as viaturas</option>
          {viaturas.map((viatura) => (
            <option key={viatura.id} value={viatura.id}>{viatura.matricula}</option>
          ))}
        </select>

        <select
          className="form-select form-select-sm"
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
          views={['month']}
          defaultView="month"
          style={{ height: '75vh', minHeight: '600px' }}
        />

        <div className="d-flex gap-3 mt-3 small text-muted">
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
    </div>
  );
};

export default AgendaPage;
