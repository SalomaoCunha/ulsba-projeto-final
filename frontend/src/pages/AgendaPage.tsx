import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, type EventProps, type ToolbarProps, type SlotInfo } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  endOfDay,
  isSameDay,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVoltas, getVisitasAgenda } from '../services/voltaService';
import { getEquipas } from '../services/equipaService';
import { getViaturas, getBloqueiosViaturas, viaturaBloqueadaNoDia } from '../services/viaturaService';
import { getUtentes } from '../services/utenteService';
import { LABEL_ESTADO_VOLTA, COR_ESTADO_VOLTA } from '../config/estadoVolta';
import type { Volta, EstadoVolta, VisitaAgenda, EstadoVisita } from '../types/volta';
import type { Equipa } from '../types/equipa';
import type { BloqueioViatura, Viatura } from '../types/viatura';
import type { Utente } from '../types/utente';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import { formatarHora } from '../utils/formatarHora';
import PainelConstrucaoRota from '../components/PainelConstrucaoRota';

// Localizador do react-big-calendar baseado em date-fns, configurado com o
// locale pt-PT (necessário para nomes de meses/dias e para o cálculo correto
// do início da semana).
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'pt-PT': pt } });

// Traduções dos textos fixos da UI do react-big-calendar (a biblioteca não
// traduz automaticamente, só o locale das datas vem do date-fns acima).
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

// As três perspetivas da agenda (RF19): por unidade (todas as voltas, filtráveis
// por equipa/viatura/estado), por profissional (voltas de um profissional
// específico, que pode pertencer a várias equipas) ou por utente (as visitas
// domiciliárias desse utente, independentemente de quem as realiza).
type VistaAgenda = 'unidade' | 'profissional' | 'utente';

// Opção de profissional construída a partir dos membros de todas as equipas,
// já com a lista de códigos de equipa a que pertence (um profissional pode
// estar em mais do que uma equipa).
interface ProfissionalOpcao {
  id: number;
  nome: string;
  funcao: string;
  equipasCodigos: string[];
}

// União discriminada dos três tipos de "evento" que podem aparecer no
// calendário: uma volta completa (vista Unidade/Profissional), uma visita
// isolada a um utente (vista Utente) ou um bloqueio de viatura (manutenção ou
// indisponibilidade), que é sobreposto ao calendário independentemente da vista.
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
    }
  | {
      tipo: 'bloqueio_viatura';
      id: number;
      title: string;
      start: Date;
      end: Date;
      matricula: string;
      resource: BloqueioViatura;
    };

// Componente de renderização customizada de cada evento dentro das células do
// calendário (passado a <Calendar components={{ event: ... }}>). O conteúdo
// mostrado varia com o tipo de evento: bloqueio de viatura, visita a utente
// ou volta completa.
function EventoCalendario({ event }: EventProps<EventoAgenda>) {
  if (event.tipo === 'bloqueio_viatura') {
    const tipoLabel = event.resource.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Indisponível';
    return (
      <div className="agenda-evento">
        <div className="fw-semibold text-truncate">
          <i className="bi bi-slash-circle me-1"></i>
          {event.matricula}
        </div>
        <div className="small text-truncate">
          {tipoLabel}
          {event.resource.motivo ? ` · ${event.resource.motivo}` : ''}
        </div>
      </div>
    );
  }

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

// Barra de navegação customizada do calendário (substitui a toolbar padrão do
// react-big-calendar), com apenas os botões de mês anterior/seguinte e o
// rótulo do mês atual — não há seletor de vista porque só se usa a vista "month".
function BarraCalendario({ label, onNavigate }: ToolbarProps<EventoAgenda>) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        aria-label="Mês anterior"
        style={{ minWidth: '44px', minHeight: '44px' }}
        onClick={() => onNavigate('PREV')}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
      <span className="fw-medium text-capitalize">{label}</span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        aria-label="Mês seguinte"
        style={{ minWidth: '44px', minHeight: '44px' }}
        onClick={() => onNavigate('NEXT')}
      >
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

// Página de Agenda: calendário mensal de voltas/visitas com três perspetivas
// (Unidade/Profissional/Utente — RF19), filtros por equipa/viatura/profissional/
// utente/estado, sobreposição de bloqueios de viaturas e um modal de detalhe
// do dia selecionado que também permite agendar uma nova volta (via
// PainelConstrucaoRota).
const AgendaPage = () => {
  const [searchParams] = useSearchParams();
  // Permite abrir a agenda já filtrada/posicionada numa vista específica a
  // partir de um link externo (ex.: "ver agenda deste profissional" a partir
  // da página de Equipas, ou "ver agenda desta viatura").
  const viaturaIdInicial = searchParams.get('viaturaId');
  const profissionalIdInicial = searchParams.get('profissionalId');
  const utenteIdInicial = searchParams.get('utenteId');

  // A vista inicial é inferida a partir dos parâmetros da URL: se vier um
  // utenteId, abre-se logo na vista Utente; senão, se vier um profissionalId,
  // na vista Profissional; caso contrário, a vista padrão é Unidade.
  const vistaInicial: VistaAgenda = utenteIdInicial
    ? 'utente'
    : profissionalIdInicial
      ? 'profissional'
      : 'unidade';

  const [vista, setVista] = useState<VistaAgenda>(vistaInicial);
  const [voltas, setVoltas] = useState<Volta[]>([]);
  const [visitas, setVisitas] = useState<VisitaAgenda[]>([]);
  const [voltasDoMes, setVoltasDoMes] = useState<Volta[]>([]);
  const [bloqueiosViaturas, setBloqueiosViaturas] = useState<BloqueioViatura[]>([]);
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
  const [mostrarFormularioNovaVolta, setMostrarFormularioNovaVolta] = useState(false);

  // Intervalo [início, fim] do mês atualmente visível no calendário, usado
  // como filtro de datas em todos os pedidos à API. Só muda quando o mês
  // muda (dataAtual), não a cada render.
  const intervalo = useMemo(() => ({
    dataInicio: format(startOfMonth(dataAtual), 'yyyy-MM-dd'),
    dataFim: format(endOfMonth(dataAtual), 'yyyy-MM-dd'),
  }), [dataAtual]);

  const navigate = useNavigate();

  // Carrega uma única vez, ao montar a página, os dados de referência
  // (equipas, viaturas, utentes) usados para preencher os filtros — estes não
  // dependem do mês nem da vista selecionada.
  useEffect(() => {
    comAtrasoMinimo(Promise.allSettled([
      getEquipas().then(setEquipas),
      getViaturas().then(setViaturas),
      getUtentes().then(setUtentes),
    ])).finally(() => setCarregando(false));
  }, []);

  const equipaAtiva = useMemo(
    () => equipas.find((eq) => eq.id === equipaId) ?? null,
    [equipas, equipaId],
  );

  const viaturaAtiva = useMemo(
    () => viaturas.find((v) => v.id === viaturaId) ?? null,
    [viaturas, viaturaId],
  );

  // Mapa id -> matrícula, usado para mostrar a matrícula nos bloqueios de
  // viatura (que só trazem o id) sem ter de procurar na lista a cada render.
  const mapaMatriculas = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const v of viaturas) {
      mapa.set(v.id, v.matricula);
    }
    return mapa;
  }, [viaturas]);

  // Lista de profissionais para o filtro da vista Profissional, construída a
  // partir dos membros de todas as equipas (não existe um endpoint próprio
  // de "profissionais"). Um mesmo profissional pode aparecer como membro em
  // várias equipas, por isso agrega-se por id e acumulam-se todos os códigos
  // de equipa a que pertence, em vez de duplicar a entrada.
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

  const profissionalAtivo = useMemo(
    () => profissionais.find((profissional) => profissional.id === profissionalId) ?? null,
    [profissionais, profissionalId],
  );

  const utenteAtivo = useMemo(
    () => utentes.find((utente) => Number(utente.id) === utenteId) ?? null,
    [utentes, utenteId],
  );

  // Recarrega os dados principais do calendário de acordo com a vista ativa:
  // na vista Utente pede visitas (filtradas por utente/estado de visita); nas
  // outras duas pede voltas, aplicando o filtro de equipa só na vista Unidade
  // e o de profissional só na vista Profissional (os dois nunca se aplicam
  // ao mesmo tempo). É um useCallback porque é chamado tanto pelo useEffect
  // de sincronização como manualmente depois de criar uma nova volta.
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

  // Carrega, independentemente da vista e dos filtros, TODAS as voltas e
  // bloqueios de viaturas do mês. Isto é necessário porque o
  // PainelConstrucaoRota (agendar nova volta) precisa de conhecer todas as
  // voltas/bloqueios do mês para detetar conflitos de agenda, mesmo que a
  // vista atual esteja filtrada a uma equipa ou profissional específico.
  const recarregarVoltasEBloqueiosDoMes = useCallback(() => {
    return Promise.all([
      getVoltas(intervalo)
        .then(setVoltasDoMes)
        .catch((erro) => console.error('Falha ao carregar voltas do mês:', erro)),
      getBloqueiosViaturas(intervalo)
        .then(setBloqueiosViaturas)
        .catch((erro) => console.error('Falha ao carregar bloqueios de viaturas:', erro)),
    ]);
  }, [intervalo]);

  // Dispara recarregarDadosVista sempre que a vista, o mês ou algum dos
  // filtros mudar (todos esses são dependências de recarregarDadosVista).
  useEffect(() => {
    recarregarDadosVista();
  }, [recarregarDadosVista]);

  // Dispara recarregarVoltasEBloqueiosDoMes apenas quando o mês muda — estes
  // dados não dependem da vista nem dos filtros (ver comentário acima).
  useEffect(() => {
    recarregarVoltasEBloqueiosDoMes();
  }, [recarregarVoltasEBloqueiosDoMes]);

  // Troca de vista: limpa a seleção de dia e esconde o formulário de nova
  // volta, para não deixar o modal aberto numa vista que já não corresponde.
  const mudarVista = (novaVista: VistaAgenda) => {
    setVista(novaVista);
    setDiaSelecionado(null);
    setMostrarFormularioNovaVolta(false);
  };

  // Bloqueios de viatura a sobrepor ao calendário: não fazem sentido na vista
  // Utente (que não tem noção de viatura), e quando há uma viatura filtrada
  // mostram-se só os bloqueios dessa viatura.
  const bloqueiosVisiveisNoCalendario = useMemo(() => {
    if (vista === 'utente') return [];
    if (viaturaId !== undefined) {
      return bloqueiosViaturas.filter((b) => b.viatura_id === viaturaId);
    }
    return bloqueiosViaturas;
  }, [vista, viaturaId, bloqueiosViaturas]);

  // Converte os dados carregados (voltas, visitas, bloqueios) no formato de
  // evento genérico que o react-big-calendar espera (com start/end como Date).
  // Na vista Utente usa-se apenas as visitas; nas outras, combinam-se as
  // voltas com os bloqueios de viatura visíveis.
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

    const eventosVoltas: EventoAgenda[] = voltas.map((volta) => ({
      tipo: 'volta',
      id: volta.id,
      voltaId: volta.id,
      title: volta.designacao ?? `Volta ${volta.id}`,
      start: new Date(volta.partidaPrevista ?? volta.data),
      end: new Date(volta.regressoPrevisto ?? volta.data),
      cor: COR_ESTADO_VOLTA[volta.estado],
      resource: volta,
    }));

    const eventosBloqueios: EventoAgenda[] = bloqueiosVisiveisNoCalendario.map((bloqueio) => {
      const matricula = mapaMatriculas.get(bloqueio.viatura_id) ?? `Viatura #${bloqueio.viatura_id}`;
      return {
        tipo: 'bloqueio_viatura',
        id: bloqueio.id,
        title: `${matricula} bloqueada`,
        start: parse(bloqueio.data_inicio, 'yyyy-MM-dd', new Date()),
        // endOfDay porque a data_fim do bloqueio é um dia inteiro (sem hora);
        // sem isto o evento terminaria à meia-noite desse dia e pareceria não
        // cobrir o último dia do bloqueio no calendário.
        end: endOfDay(parse(bloqueio.data_fim, 'yyyy-MM-dd', new Date())),
        matricula,
        resource: bloqueio,
      };
    });

    return [...eventosVoltas, ...eventosBloqueios];
  }, [vista, voltas, visitas, bloqueiosVisiveisNoCalendario, mapaMatriculas]);

  const eventosOrdenados = useMemo(
    () => [...eventos].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [eventos],
  );

  // Define a cor/estilo de cada evento no calendário (eventPropGetter): os
  // bloqueios de viatura usam um estilo tracejado distinto (laranja para
  // manutenção, vermelho para indisponibilidade pontual) para se distinguirem
  // claramente das voltas/visitas, que usam a cor do seu próprio estado.
  const aoEstilizarEvento = useCallback((evento: EventoAgenda) => {
    if (evento.tipo === 'bloqueio_viatura') {
      const manutencao = evento.resource.tipo === 'MANUTENCAO';
      return {
        style: {
          backgroundColor: manutencao ? 'rgba(253, 126, 20, 0.22)' : 'rgba(220, 53, 69, 0.20)',
          color: manutencao ? '#7a3b00' : '#842029',
          border: `1px dashed ${manutencao ? 'rgba(253, 126, 20, 0.7)' : 'rgba(220, 53, 69, 0.65)'}`,
          opacity: 0.85,
        },
      };
    }

    return {
      style: { backgroundColor: evento.cor, border: 'none' },
    };
  }, []);

  // Define o estilo de fundo de cada célula de dia do calendário
  // (dayPropGetter): quando há uma viatura filtrada e essa viatura está
  // bloqueada nesse dia, pinta a célula inteira com um tom claro
  // correspondente ao tipo de bloqueio, para dar destaque visual ao dia
  // mesmo antes de olhar para os eventos individuais.
  const aoEstilizarDia = useCallback(
    (dataDia: Date) => {
      if (vista === 'utente' || viaturaId === undefined) return {};
      const diaIso = format(dataDia, 'yyyy-MM-dd');
      const bloqueio = viaturaBloqueadaNoDia(bloqueiosViaturas, viaturaId, diaIso);
      if (!bloqueio) return {};

      const manutencao = bloqueio.tipo === 'MANUTENCAO';
      return {
        style: {
          backgroundColor: manutencao ? 'rgba(253, 126, 20, 0.12)' : 'rgba(220, 53, 69, 0.11)',
        },
      };
    },
    [vista, viaturaId, bloqueiosViaturas],
  );

  // As três listas seguintes alimentam o modal de detalhe do dia
  // selecionado (diaSelecionado): voltas e visitas desse dia (uma delas é
  // usada dependendo da vista) e os bloqueios de viatura que o cobrem.

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

  const bloqueiosDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const diaIso = format(diaSelecionado, 'yyyy-MM-dd');
    // Bloqueio "cobre" o dia selecionado quando o dia cai entre o início e o
    // fim do bloqueio (inclusive), não apenas quando coincide com um dos
    // extremos — por isso a comparação é por intervalo e não por igualdade.
    return bloqueiosVisiveisNoCalendario.filter(
      (b) => b.data_inicio <= diaIso && b.data_fim >= diaIso,
    );
  }, [diaSelecionado, bloqueiosVisiveisNoCalendario]);

  // Abre o modal de detalhe de um dia (clique numa célula do calendário ou
  // num evento de bloqueio) e garante que não aparece logo o formulário de
  // nova volta de uma seleção de dia anterior.
  const abrirDia = (data: Date) => {
    setDiaSelecionado(data);
    setMostrarFormularioNovaVolta(false);
  };

  if (carregando) {
    return <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />;
  }

  // Texto de subtítulo mostrado no topo da página, resumindo a vista e os
  // filtros ativos em cada uma das três perspetivas.
  const descricaoContextoAtual =
    vista === 'unidade'
      ? `Vista Unidade · ${equipaAtiva ? `Equipa ${equipaAtiva.codigo}` : 'Todas as equipas'} · ${viaturaAtiva ? `Viatura ${viaturaAtiva.matricula}` : 'Todas as viaturas'}`
      : vista === 'profissional'
        ? `Vista Profissional · ${profissionalAtivo ? `${profissionalAtivo.nome} (${profissionalAtivo.funcao} · Eq. ${profissionalAtivo.equipasCodigos.join(', ')})` : 'Todos os profissionais'}`
        : `Vista Utente · ${utenteAtivo ? utenteAtivo.nome : 'Todos os utentes'} · Visitas domiciliárias`;

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Calendário de Voltas</h1>
          <p className="text-muted mb-0 small">{descricaoContextoAtual}</p>
        </div>
        {vista === 'unidade' && (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
              <i className="bi bi-people-fill me-1"></i>
              {equipaAtiva ? `Equipa ${equipaAtiva.codigo}` : 'Todas as equipas'}
            </span>
          </div>
        )}
      </div>

      {/* Separadores de perspetiva: Unidade / Profissional / Utente (RF19) */}
      <ul className="nav nav-pills flex-wrap gap-2 mb-3" aria-label="Perspetiva da agenda">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'unidade' ? 'active' : ''}`}
            aria-pressed={vista === 'unidade'}
            style={{ minHeight: '44px' }}
            onClick={() => mudarVista('unidade')}
          >
            Unidade
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'profissional' ? 'active' : ''}`}
            aria-pressed={vista === 'profissional'}
            style={{ minHeight: '44px' }}
            onClick={() => mudarVista('profissional')}
          >
            Profissional
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${vista === 'utente' ? 'active' : ''}`}
            aria-pressed={vista === 'utente'}
            style={{ minHeight: '44px' }}
            onClick={() => mudarVista('utente')}
          >
            Utente
          </button>
        </li>
      </ul>

      {/* Filtros explícitos de cada vista (sem filtro de Equipas na vista Utente — RF19/RF49) */}
      <div className="d-flex flex-wrap gap-2 mb-3 agenda-filtros">
        {vista === 'unidade' && (
          <select
            aria-label="Selecionar equipa"
            className="form-select form-select-sm agenda-filtro-select fw-medium"
            value={equipaId ?? ''}
            onChange={(e) => setEquipaId(e.target.value === '' ? undefined : Number(e.target.value))}
          >
            <option value="">Todas as equipas</option>
            {equipas.map((equipa) => (
              <option key={equipa.id} value={equipa.id}>
                {`Equipa ${equipa.codigo}`}
              </option>
            ))}
          </select>
        )}

        {vista === 'profissional' && (
          <select
            aria-label="Selecionar profissional"
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
              aria-label="Selecionar viatura"
              className="form-select form-select-sm agenda-filtro-select"
              value={viaturaId ?? ''}
              onChange={(e) => setViaturaId(e.target.value === '' ? undefined : Number(e.target.value))}
            >
              <option value="">Todas as viaturas</option>
              {viaturas.map((viatura) => (
                <option key={viatura.id} value={viatura.id}>
                  {viatura.matricula} {viatura.designacao ? `— ${viatura.designacao}` : ''}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar voltas por estado"
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
              aria-label="Selecionar utente"
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
              aria-label="Filtrar visitas por estado"
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
        <section className="agenda-lista-mobile d-md-none mb-3" aria-labelledby="agenda-eventos-mobile-titulo">
          <div className="mb-2">
            <h2 id="agenda-eventos-mobile-titulo" className="h6 fw-semibold mb-1 text-capitalize">
              Eventos de {format(dataAtual, 'MMMM yyyy', { locale: pt })}
            </h2>
            <p className="small text-muted mb-0">
              Toca num evento para abrir os detalhes. Usa o calendário abaixo para consultar ou planear outro dia.
            </p>
          </div>

          {eventosOrdenados.length === 0 ? (
            <p className="small text-muted border rounded p-3 mb-0">
              Não há eventos neste mês com os filtros selecionados.
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {eventosOrdenados.map((evento) => {
                const ehBloqueio = evento.tipo === 'bloqueio_viatura';
                const titulo = evento.tipo === 'volta'
                  ? evento.title
                  : evento.tipo === 'visita'
                    ? evento.resource.utenteNome
                    : `${evento.matricula} · ${evento.resource.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Indisponível'}`;
                const data = ehBloqueio
                  ? isSameDay(evento.start, evento.end)
                    ? format(evento.start, 'd MMM', { locale: pt })
                    : `${format(evento.start, 'd MMM', { locale: pt })} – ${format(evento.end, 'd MMM', { locale: pt })}`
                  : format(evento.start, 'd MMM', { locale: pt });
                const detalhe = evento.tipo === 'volta'
                  ? `${format(evento.start, 'HH:mm')}–${format(evento.end, 'HH:mm')} · ${evento.resource.equipaCodigo ? `Equipa ${evento.resource.equipaCodigo}` : 'Sem equipa'} · ${LABEL_ESTADO_VOLTA[evento.resource.estado]}`
                  : evento.tipo === 'visita'
                    ? `${format(evento.start, 'HH:mm')}–${format(evento.end, 'HH:mm')} · ${LABEL_ESTADO_VISITA[evento.resource.visitaEstado]}`
                    : evento.resource.motivo || 'Bloqueio de viatura';
                const cor = evento.tipo === 'bloqueio_viatura'
                  ? evento.resource.tipo === 'MANUTENCAO' ? '#fd7e14' : '#dc3545'
                  : evento.cor;

                return (
                  <button
                    key={`${evento.tipo}-${evento.id}`}
                    type="button"
                    className="agenda-evento-mobile-item btn btn-light border d-flex align-items-center gap-3 text-start"
                    aria-label={`Abrir ${evento.tipo === 'bloqueio_viatura' ? 'bloqueio' : evento.tipo}: ${titulo}, ${data}, ${detalhe}`}
                    onClick={() => {
                      if (ehBloqueio) {
                        abrirDia(evento.start);
                      } else {
                        navigate(`/agenda/voltas/${evento.voltaId}`);
                      }
                    }}
                  >
                    <span className="agenda-evento-mobile-data text-center text-muted small flex-shrink-0">
                      {data}
                    </span>
                    <span className="rounded-circle flex-shrink-0" aria-hidden="true" style={{ width: '10px', height: '10px', backgroundColor: cor }} />
                    <span className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                      <span className="fw-medium text-dark text-truncate">{titulo}</span>
                      <span className="small text-muted text-truncate">{detalhe}</span>
                    </span>
                    <i className="bi bi-chevron-right text-muted small" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="agenda-calendar-scroll">
          <Calendar<EventoAgenda>
            localizer={localizer}
            culture="pt-PT"
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            components={{ event: EventoCalendario, toolbar: BarraCalendario }}
            eventPropGetter={aoEstilizarEvento}
            dayPropGetter={aoEstilizarDia}
            date={dataAtual}
            onNavigate={setDataAtual}
            onSelectEvent={(evento) => {
              // Clicar num bloqueio de viatura abre o modal de detalhe do
              // dia (não há página própria de "bloqueio"); clicar numa
              // volta ou visita navega para o detalhe dessa volta.
              if (evento.tipo === 'bloqueio_viatura') {
                abrirDia(evento.start);
                return;
              }
              navigate(`/agenda/voltas/${evento.voltaId}`);
            }}
            selectable
            onSelectSlot={(slot: SlotInfo) => abrirDia(slot.start)}
            views={['month']}
            defaultView="month"
            messages={MENSAGENS_PT}
            style={{ height: 'auto', minHeight: '600px' }}
          />
        </div>

        {/* Legenda de cores: estados de visita na vista Utente, ou estados de
            volta + indicação de viatura bloqueada nas outras vistas */}
        <div className="d-flex flex-wrap gap-3 mt-3 small text-muted">
          {vista === 'utente' ? (
            (Object.keys(LABEL_ESTADO_VISITA) as EstadoVisita[]).map((chave) => (
              <span key={chave} className="d-flex align-items-center gap-1">
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VISITA[chave] }}
                />
                {LABEL_ESTADO_VISITA[chave]}
              </span>
            ))
          ) : (
            <>
              {(Object.keys(LABEL_ESTADO_VOLTA) as EstadoVolta[]).map((chave) => (
                <span key={chave} className="d-flex align-items-center gap-1">
                  <span
                    className="rounded-circle d-inline-block"
                    style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VOLTA[chave] }}
                  />
                  {LABEL_ESTADO_VOLTA[chave]}
                </span>
              ))}
              <span className="d-flex align-items-center gap-1">
                <span
                  className="rounded d-inline-block"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'rgba(220, 53, 69, 0.22)',
                    border: '1px dashed rgba(220, 53, 69, 0.7)',
                  }}
                />
                Viatura indisponível / bloqueada
              </span>
            </>
          )}
        </div>
      </div>

      <Modal show={diaSelecionado !== null} onHide={() => setDiaSelecionado(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-capitalize fs-6">
            {diaSelecionado && format(diaSelecionado, "d 'de' MMMM", { locale: pt })}
            {equipaAtiva ? ` · Equipa ${equipaAtiva.codigo}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Aviso de viaturas bloqueadas neste dia (não aplicável à vista Utente) */}
          {vista !== 'utente' && bloqueiosDoDia.length > 0 && (
            <div className="mb-3">
              <div className="small fw-semibold text-danger mb-1">
                <i className="bi bi-slash-circle me-1"></i>
                Viaturas bloqueadas neste dia
              </div>
              {bloqueiosDoDia.map((bloq) => (
                <div
                  key={bloq.id}
                  className="small rounded px-2 py-1 mb-1"
                  style={{
                    backgroundColor:
                      bloq.tipo === 'MANUTENCAO'
                        ? 'rgba(253, 126, 20, 0.15)'
                        : 'rgba(220, 53, 69, 0.14)',
                    color: bloq.tipo === 'MANUTENCAO' ? '#7a3b00' : '#842029',
                  }}
                >
                  <strong>{mapaMatriculas.get(bloq.viatura_id) ?? `Viatura #${bloq.viatura_id}`}</strong> —{' '}
                  {bloq.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Indisponibilidade pontual'}
                  {bloq.motivo ? ` (${bloq.motivo})` : ''}
                </div>
              ))}
            </div>
          )}

          {/* Corpo do modal do dia: na vista Utente mostra sempre a lista de
              visitas desse dia. Nas outras vistas, mostra a lista de voltas
              existentes — a menos que não haja nenhuma, ou que o utilizador
              tenha pedido explicitamente para agendar mais uma
              (mostrarFormularioNovaVolta), caso em que aparece o formulário
              de construção de rota. */}
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
          ) : voltasDoDia.length === 0 || mostrarFormularioNovaVolta ? (
            diaSelecionado && (
              <PainelConstrucaoRota
                // A key inclui dia/equipa/viatura para forçar o React a
                // remontar o painel (e assim repor o seu estado interno do
                // formulário) sempre que estes mudarem, em vez de reutilizar
                // uma instância com dados de um contexto diferente.
                key={`${format(diaSelecionado, 'yyyy-MM-dd')}-${equipaId ?? 'todas'}-${viaturaId ?? 'todas'}`}
                data={diaSelecionado}
                equipas={equipas}
                equipaIdInicial={equipaId}
                viaturas={viaturas}
                bloqueiosViaturas={bloqueiosViaturas}
                viaturaIdInicial={viaturaId}
                utentes={utentes}
                voltasDoMes={voltasDoMes}
                // Após criar a volta com sucesso, fecha o modal e recarrega
                // tanto os dados da vista atual como as voltas/bloqueios do
                // mês, para que o calendário e qualquer novo agendamento já
                // reflitam a volta recém-criada.
                onCriada={() => {
                  setDiaSelecionado(null);
                  setMostrarFormularioNovaVolta(false);
                  recarregarDadosVista();
                  recarregarVoltasEBloqueiosDoMes();
                }}
              />
            )
          ) : (
            <>
              {voltasDoDia.map((volta) => (
                <button
                  key={volta.id}
                  type="button"
                  className="d-flex justify-content-between align-items-center w-100 border-0 bg-transparent text-start py-2 border-bottom"
                  onClick={() => navigate(`/agenda/voltas/${volta.id}`)}
                >
                  <div>
                    <div className="fw-medium">{formatarHora(volta.partidaPrevista)} → {formatarHora(volta.regressoPrevisto)}</div>
                    <div className="small text-muted">{volta.equipaCodigo ? `Equipa ${volta.equipaCodigo}` : 'Sem equipa'} · {volta.viaturaMatricula ?? 'Sem viatura'}</div>
                  </div>
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{ width: '10px', height: '10px', backgroundColor: COR_ESTADO_VOLTA[volta.estado] }}
                  />
                </button>
              ))}
              <button
                type="button"
                className="btn btn-outline-success btn-sm w-100 mt-3"
                onClick={() => setMostrarFormularioNovaVolta(true)}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Agendar outra volta neste dia
              </button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AgendaPage;
