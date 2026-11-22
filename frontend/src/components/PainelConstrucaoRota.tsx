import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Dropdown, Form } from 'react-bootstrap';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { criarVolta } from '../services/voltaService';
import { viaturaBloqueadaNoDia } from '../services/viaturaService';
import { getNivelPrioridade } from '../config/niveis';
import type { Equipa } from '../types/equipa';
import type { BloqueioViatura, Viatura } from '../types/viatura';
import type { Volta } from '../types/volta';
import type { Utente } from '../types/utente';

interface Props {
  // Dia para o qual se está a construir a volta (vem do calendário da página pai).
  data: Date;
  // Todas as equipas (o painel filtra as que já têm volta nesse dia).
  equipas: Equipa[];
  // Pré-seleciona uma equipa ao abrir o painel (ex.: utilizador clicou numa
  // equipa específica no calendário); só é aplicada se essa equipa ainda
  // estiver disponível nesse dia.
  equipaIdInicial?: number;
  // Todas as viaturas da frota (o painel filtra as indisponíveis nesse dia).
  viaturas: Viatura[];
  // Bloqueios/impedimentos de viaturas (manutenção, avaria, etc.) usados
  // para calcular quais viaturas estão realmente livres no dia escolhido.
  bloqueiosViaturas: BloqueioViatura[];
  // Pré-seleciona uma viatura ao abrir o painel, com a mesma lógica da equipa.
  viaturaIdInicial?: number;
  // Todos os utentes (o painel filtra para os Ativos e aplica os critérios
  // de seleção/ordenação descritos abaixo).
  utentes: Utente[];
  // Todas as voltas do mês corrente, usadas só para saber o que já está
  // ocupado nesse dia (equipas e viaturas já escaladas).
  voltasDoMes: Volta[];
  // Chamado depois de a volta ser criada com sucesso no backend, para a
  // página pai poder recarregar a lista/calendário.
  onCriada: () => void;
}

// Ponto de partida e regresso de todas as voltas (sede/base operacional em
// Beja). Usado como origem da pré-visualização de rota e como referência de
// proximidade quando ainda não há nenhum utente selecionado.
const BASE_BEJA: { lat: number; lng: number; nome: string } = {
  lat: 38.016,
  lng: -7.872,
  nome: 'Base Beja',
};

// Distância em linha reta (fórmula de Haversine) entre dois pontos, em km,
// arredondada a 1 casa decimal. Devolve null se alguma coordenada for
// inválida/ausente ou se o segundo ponto for exatamente (0,0) — convenção
// usada no projeto para "sem coordenadas registadas", distinta de uma
// coordenada real perto do equador/meridiano de referência.
// É só uma estimativa para orientar a escolha de utentes e a pré-
// visualização — não corresponde à distância real percorrida por estrada.
function calcularDistanciaKm(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null,
): number | null {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lng1 === null ||
    lng1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lng2 === null ||
    lng2 === undefined ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2) ||
    (lat2 === 0 && lng2 === 0)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Number((2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

// Extrai as coordenadas de um utente como par [lat, lng], ou null se não
// tiver coordenadas válidas registadas (mesma convenção de (0,0) = "sem
// coordenadas" usada em `calcularDistanciaKm`).
function obterCoordenadas(utente: Utente): [number, number] | null {
  if (
    utente.lat === null ||
    utente.lng === null ||
    !Number.isFinite(utente.lat) ||
    !Number.isFinite(utente.lng) ||
    (utente.lat === 0 && utente.lng === 0)
  ) {
    return null;
  }
  return [utente.lat, utente.lng];
}

// Número de dias desde a última visita registada; null se não houver data
// ou se a data for inválida. Usado no critério de ordenação "mais tempo sem
// visita" e no aviso visual de utentes há muito sem visita (>= 14 dias).
function diasSemVisita(ultimaVisita?: string | null): number | null {
  if (!ultimaVisita) return null;
  const dt = parseISO(ultimaVisita);
  if (Number.isNaN(dt.getTime())) return null;
  return Math.max(0, differenceInCalendarDays(new Date(), dt));
}

// Ajusta o enquadramento (zoom/centro) do mini-mapa de pré-visualização da
// rota sempre que a lista de pontos muda: com 2+ pontos enquadra todos
// (fitBounds), com 1 só centra nele, e sem nenhum mostra a Base de Beja.
// Também corre no mount e observa o tamanho do contentor (tal como no
// MapaLeaflet/MapaPercursoVolta) porque este painel vive dentro de um
// offcanvas/modal cujo tamanho real só é conhecido depois do primeiro render.
function AjustarVistaPrevia({ pontos }: { pontos: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const ajustarVista = () => {
      map.invalidateSize();
      if (pontos.length >= 2) {
        map.fitBounds(pontos, { padding: [24, 24] });
      } else if (pontos.length === 1) {
        map.setView(pontos[0], 11);
      } else {
        map.setView([BASE_BEJA.lat, BASE_BEJA.lng], 9);
      }
    };

    ajustarVista();
    const observer = new ResizeObserver(ajustarVista);
    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map, pontos]);

  return null;
}

// Formulário guiado (wizard em passos, não em páginas separadas) para
// agendar uma nova volta num dia escolhido: 1) escolher equipa ativa e
// livre nesse dia, 2) escolher viatura sem impedimentos nesse dia, 3)
// escolher os utentes a visitar (com critérios de apoio — prioridade,
// tempo sem visita, proximidade — e filtro por localidade), 4) pré-ver o
// percurso num mapa, e por fim confirmar e criar a volta no backend. Os
// passos 2-4 só ficam disponíveis depois de completado o anterior
// (`passoDesbloqueado`), para impedir uma volta sem meios para ser feita.
const PainelConstrucaoRota = ({
  data,
  equipas,
  equipaIdInicial,
  viaturas,
  bloqueiosViaturas,
  viaturaIdInicial,
  utentes,
  voltasDoMes,
  onCriada,
}: Props) => {
  const diaIso = format(data, 'yyyy-MM-dd');
  // Voltas desse dia específico que ainda contam como "ocupação" real —
  // uma volta CANCELADA não bloqueia a equipa/viatura para uma nova volta.
  const voltasDesseDia = useMemo(
    () => voltasDoMes.filter((v) => v.data === diaIso && v.estado !== 'CANCELADA'),
    [voltasDoMes, diaIso],
  );

  // Só entram equipas ativas que ainda não têm nenhuma volta nesse dia —
  // cada equipa só pode fazer uma volta por dia.
  const equipasDisponiveis = useMemo(
    () =>
      equipas.filter(
        (equipa) =>
          equipa.ativa && !voltasDesseDia.some((v) => v.equipaId === equipa.id),
      ),
    [equipas, voltasDesseDia],
  );

  // Inicializa com `equipaIdInicial` só se essa equipa ainda estiver
  // disponível nesse dia; caso contrário cai para a primeira disponível.
  const [equipaId, setEquipaId] = useState<number | undefined>(() => {
    if (equipaIdInicial !== undefined && equipasDisponiveis.some((eq) => eq.id === equipaIdInicial)) {
      return equipaIdInicial;
    }
    return equipasDisponiveis[0]?.id;
  });

  const equipaSelecionada = useMemo(
    () => equipasDisponiveis.find((eq) => eq.id === equipaId) ?? null,
    [equipasDisponiveis, equipaId],
  );

  // 2. Viaturas disponíveis reais no dia (desconta bloqueios/impedimentos, estado e voltas marcadas)
  // Uma viatura só entra em `disponiveis` se passar as três verificações,
  // por esta ordem de prioridade na mensagem de motivo: (1) não ter um
  // bloqueio/manutenção agendado para este dia, (2) o seu estado geral ser
  // OPERACIONAL, e (3) não estar já escalada noutra volta no mesmo dia.
  // As excluídas vão para `viaturasIndisponiveisDia` com o motivo, para
  // serem explicadas ao utilizador no formulário (em vez de simplesmente
  // desaparecerem da lista sem explicação).
  const { viaturasDisponiveis, viaturasIndisponiveisDia } = useMemo(() => {
    const disponiveis: Viatura[] = [];
    const indisponiveis: { viatura: Viatura; motivo: string }[] = [];

    for (const v of viaturas) {
      const bloqueio = viaturaBloqueadaNoDia(bloqueiosViaturas, v.id, diaIso);
      const ocupadaEmVolta = voltasDesseDia.some((volta) => volta.viaturaId === v.id);

      if (bloqueio) {
        indisponiveis.push({
          viatura: v,
          motivo:
            bloqueio.tipo === 'MANUTENCAO'
              ? `Manutenção${bloqueio.motivo ? ` (${bloqueio.motivo})` : ''}`
              : `Bloqueada${bloqueio.motivo ? ` (${bloqueio.motivo})` : ''}`,
        });
      } else if (v.estado !== 'OPERACIONAL') {
        indisponiveis.push({
          viatura: v,
          motivo: v.estado === 'EM_MANUTENCAO' ? 'Em revisão' : 'Inativa',
        });
      } else if (ocupadaEmVolta) {
        indisponiveis.push({
          viatura: v,
          motivo: 'Já escalada noutra volta neste dia',
        });
      } else {
        disponiveis.push(v);
      }
    }

    return { viaturasDisponiveis: disponiveis, viaturasIndisponiveisDia: indisponiveis };
  }, [viaturas, bloqueiosViaturas, diaIso, voltasDesseDia]);

  // Mesma lógica da equipa, mas sem fallback automático: se a viatura
  // inicial já não estiver disponível, fica sem viatura escolhida (undefined)
  // para obrigar o utilizador a escolher explicitamente uma disponível.
  const [viaturaId, setViaturaId] = useState<number | undefined>(() => {
    if (viaturaIdInicial !== undefined && viaturasDisponiveis.some((v) => v.id === viaturaIdInicial)) {
      return viaturaIdInicial;
    }
    return undefined;
  });

  const [localidadesSelecionadas, setLocalidadesSelecionadas] = useState<string[]>([]);
  const [ordenacaoUtentes, setOrdenacaoUtentes] = useState<'PRIORIDADE_E_TEMPO' | 'MAIS_TEMPO_SEM_VISITA' | 'PROXIMIDADE'>('PRIORIDADE_E_TEMPO');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [aEnviar, setAEnviar] = useState(false);
  const [erroAgendamento, setErroAgendamento] = useState<string | null>(null);

  const equipaDisponivel = equipaSelecionada !== null;
  const viaturaSelecionadaDisponivel =
    viaturaId !== undefined && viaturasDisponiveis.some((viatura) => viatura.id === viaturaId);
  // A escolha de utentes (passo 3) só é desbloqueada depois de equipa e
  // viatura estarem ambas definidas e disponíveis nesse dia — evita montar
  // uma volta sem meios para a executar.
  const passoDesbloqueado = equipaDisponivel && viaturaSelecionadaDisponivel;

  // Localidades únicas entre os utentes Ativos, para o filtro de localidade
  // do passo 3 (reconstruído sempre que a lista de utentes muda).
  const localidadesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    for (const u of utentes) {
      if (u.estado === 'Ativo' && u.localidade) conjunto.add(u.localidade);
    }
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [utentes]);

  // Resolve a lista de IDs selecionados (`selecionados`) para os objetos
  // Utente completos, na mesma ordem em que foram selecionados — essa ordem
  // é depois usada como a sequência da rota (ver `coordenadasRota`).
  const utentesSelecionados = useMemo(
    () => {
      const porId = new Map(utentes.map((utente) => [Number(utente.id), utente]));
      return selecionados
        .map((id) => porId.get(id))
        .filter((utente): utente is Utente => utente !== undefined);
    },
    [utentes, selecionados],
  );

  // Ponto de referência: último utente selecionado com coordenadas ou Base de Beja.
  // Serve de base ao critério de ordenação "Mais próximo" (PROXIMIDADE) —
  // à medida que se vão selecionando utentes, a lista reordena-se para
  // sugerir sempre o próximo mais próximo do último que foi adicionado,
  // simulando a construção incremental de um percurso.
  const pontoReferencia = useMemo(() => {
    const ultimo = [...utentesSelecionados].reverse().find((utente) => obterCoordenadas(utente));
    const coordenadas = ultimo ? obterCoordenadas(ultimo) : null;
    if (ultimo && coordenadas) {
      return { lat: coordenadas[0], lng: coordenadas[1], label: ultimo.localidade || ultimo.nome };
    }
    return { lat: BASE_BEJA.lat, lng: BASE_BEJA.lng, label: BASE_BEJA.nome };
  }, [utentesSelecionados]);

  // Lista de utentes elegíveis (passo 3) já com os critérios de apoio à
  // escolha calculados e ordenados. Só considera utentes Ativos e, se
  // houver filtro de localidade, respeita-o. Recalcula sempre que mudam os
  // utentes, o filtro de localidade, o critério de ordenação escolhido ou o
  // ponto de referência (que por sua vez muda a cada seleção/remoção de
  // utente, por depender de `utentesSelecionados`).
  const utentesComCriterios = useMemo(() => {
    return utentes
      .filter(
        (u) =>
          u.estado === 'Ativo' &&
          (localidadesSelecionadas.length === 0 || localidadesSelecionadas.includes(u.localidade)),
      )
      .map((u) => {
        const dias = diasSemVisita(u.ultimaVisita);
        const distRef = calcularDistanciaKm(pontoReferencia.lat, pontoReferencia.lng, u.lat, u.lng);
        // Posição do nível de prioridade na escala de urgência (quanto menor
        // a "ordem", mais urgente); 99 é um valor de recurso para
        // prioridades sem nível configurado, para ficarem sempre no fim.
        const ordemPrioridade = getNivelPrioridade(u.prioridade)?.ordem ?? 99;
        return {
          utente: u,
          diasSemVisita: dias,
          distRefKm: distRef,
          ordemPrioridade,
        };
      })
      .sort((a, b) => {
        // Critério "Mais dias sem visita": ordena só por dias sem visita
        // (desc.), com a prioridade como desempate; utentes sem data de
        // última visita (9999) vão para o topo, por serem o caso mais crítico.
        if (ordenacaoUtentes === 'MAIS_TEMPO_SEM_VISITA') {
          const diasA = a.diasSemVisita ?? 9999;
          const diasB = b.diasSemVisita ?? 9999;
          if (diasB !== diasA) return diasB - diasA;
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        // Critério "Mais próximo": ordena pela distância em linha reta ao
        // `pontoReferencia` (o último utente selecionado, ou a Base de Beja
        // se ainda não houver seleção), com a prioridade como desempate;
        // utentes sem coordenadas (9999) ficam no fim.
        if (ordenacaoUtentes === 'PROXIMIDADE') {
          const dA = a.distRefKm ?? 9999;
          const dB = b.distRefKm ?? 9999;
          if (dA !== dB) return dA - dB;
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        // Critério por omissão "Prioridade + há mais tempo": primeiro por
        // prioridade (mais urgente primeiro), e dentro da mesma prioridade,
        // por quem está há mais tempo sem visita — é o critério pensado
        // para equilibrar urgência clínica com equidade no acompanhamento.
        if (a.ordemPrioridade !== b.ordemPrioridade) {
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        const diasA = a.diasSemVisita ?? 9999;
        const diasB = b.diasSemVisita ?? 9999;
        return diasB - diasA;
      });
  }, [utentes, localidadesSelecionadas, ordenacaoUtentes, pontoReferencia]);

  // Agrupamento por localidade para visualização de ida e regresso
  // (conta quantos utentes selecionados há em cada localidade, para o
  // resumo em badges antes da pré-visualização da rota).
  const resumoPorLocalidade = useMemo(() => {
    const mapa = new Map<string, { localidade: string; totalSelecionados: number }>();
    for (const u of utentesSelecionados) {
      const loc = u.localidade || 'Sem localidade';
      const atual = mapa.get(loc);
      if (atual) {
        atual.totalSelecionados += 1;
      } else {
        mapa.set(loc, { localidade: loc, totalSelecionados: 1 });
      }
    }
    return Array.from(mapa.values());
  }, [utentesSelecionados]);

  // Coordenadas da rota em pré-visualização: Base Beja -> utentes selecionados -> Base Beja
  // A ordem dos pontos segue a ordem de seleção dos utentes (não é
  // reotimizada geograficamente) — é uma pré-visualização simples da
  // sequência escolhida, não um cálculo de rota ótima.
  const coordenadasRota = useMemo<[number, number][]>(() => {
    const coordsUtentes: [number, number][] = utentesSelecionados
      .map(obterCoordenadas)
      .filter((coordenadas): coordenadas is [number, number] => coordenadas !== null);

    // Sem nenhum utente com coordenadas válidas não há percurso a desenhar
    // (evita mostrar só a Base de Beja isolada no mapa).
    if (coordsUtentes.length === 0) return [];
    return [[BASE_BEJA.lat, BASE_BEJA.lng], ...coordsUtentes, [BASE_BEJA.lat, BASE_BEJA.lng]];
  }, [utentesSelecionados]);

  // Utentes selecionados que não entram na pré-visualização por não terem
  // coordenadas válidas — mostrados como aviso para o utilizador saber que
  // a estimativa de distância/mapa está incompleta.
  const utentesSemCoordenadas = useMemo(
    () => utentesSelecionados.filter((utente) => obterCoordenadas(utente) === null),
    [utentesSelecionados],
  );

  // Soma das distâncias em linha reta entre pontos consecutivos da rota
  // (Base -> utente 1 -> utente 2 -> ... -> Base), só para dar uma ordem de
  // grandeza — não é a distância real por estrada.
  const distanciaEstimadaTotalKm = useMemo(() => {
    if (coordenadasRota.length < 2) return null;
    let soma = 0;
    for (let i = 0; i < coordenadasRota.length - 1; i++) {
      const d = calcularDistanciaKm(
        coordenadasRota[i][0],
        coordenadasRota[i][1],
        coordenadasRota[i + 1][0],
        coordenadasRota[i + 1][1],
      );
      if (d !== null) soma += d;
    }
    return Number(soma.toFixed(1));
  }, [coordenadasRota]);

  // Alterna a seleção de um utente (checkbox); adicionar insere-o no fim da
  // lista de selecionados, o que o torna o novo `pontoReferencia` para o
  // critério de proximidade e o último ponto antes do regresso na pré-visualização.
  const alternarSelecionado = (id: number) => {
    setErroAgendamento(null);
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((selecionadoId) => selecionadoId !== id) : [...atual, id],
    );
  };

  // Envia o pedido de criação da volta ao backend com a equipa, viatura e
  // utentes escolhidos; só é chamado quando o passo está desbloqueado e há
  // pelo menos um utente selecionado (ver `disabled` no botão em baixo).
  const submeter = async () => {
    if (!passoDesbloqueado || equipaId === undefined || viaturaId === undefined || selecionados.length === 0) return;
    setAEnviar(true);
    setErroAgendamento(null);
    try {
      await criarVolta({
        data: diaIso,
        equipaId,
        viaturaId,
        utenteIds: selecionados,
      });
      onCriada();
    } catch (erro) {
      console.error('Falha ao criar volta:', erro);
      setErroAgendamento(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível agendar a volta. Tente novamente.',
      );
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div>
      {/* 1. Equipa ativa explícita */}
      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor="equipa-rota" className="form-label small fw-medium mb-0">
            1. Equipa da volta · {format(data, 'dd/MM/yyyy')}
          </label>
          {equipaSelecionada && (
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              Equipa {equipaSelecionada.codigo} ativa
            </span>
          )}
        </div>
        <select
          id="equipa-rota"
          className="form-select form-select-sm"
          value={equipaDisponivel ? equipaId : ''}
          onChange={(e) => {
            setEquipaId(e.target.value === '' ? undefined : Number(e.target.value));
            setViaturaId(undefined);
            setSelecionados([]);
            setErroAgendamento(null);
          }}
        >
          <option value="">Escolher equipa disponível</option>
          {equipasDisponiveis.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {`Equipa ${eq.codigo}`}
            </option>
          ))}
        </select>
        {equipasDisponiveis.length === 0 && (
          <div className="form-text text-muted">
            Não há equipas ativas livres nesta data.
          </div>
        )}
      </div>

      {/* 2. Viatura disponível descontando impedimentos reais */}
      <div className="mb-3">
        <label htmlFor="viatura-rota" className="form-label small fw-medium mb-1">
          2. Viatura disponível (sem impedimentos em {diaIso})
        </label>
        <select
          id="viatura-rota"
          aria-label="Selecionar viatura disponível"
          className="form-select form-select-sm"
          disabled={!equipaDisponivel}
          value={viaturaSelecionadaDisponivel ? viaturaId : ''}
          onChange={(e) => {
            setViaturaId(e.target.value === '' ? undefined : Number(e.target.value));
            setSelecionados([]);
            setErroAgendamento(null);
          }}
        >
          <option value="">
            {!equipaDisponivel
              ? 'Selecione primeiro a equipa'
              : viaturasDisponiveis.length === 0
                ? 'Sem viaturas livres neste dia'
                : 'Escolher viatura disponível'}
          </option>
          {viaturasDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.matricula} {v.designacao ? `— ${v.designacao}` : ''} ({v.lugares} lug.)
            </option>
          ))}
        </select>

        {viaturasIndisponiveisDia.length > 0 && (
          <div className="form-text text-muted mt-1" style={{ fontSize: '0.72rem' }}>
            Excluídas neste dia:{' '}
            {viaturasIndisponiveisDia
              .map(({ viatura, motivo }) => `${viatura.matricula} [${motivo}]`)
              .join(' · ')}
          </div>
        )}
      </div>

      {/* 3. Utentes só após escolher equipa + viatura disponível, com critérios de apoio */}
      {!passoDesbloqueado ? (
        <div className="alert alert-light border text-muted small py-2">
          Selecione a <strong>equipa</strong> e uma <strong>viatura disponível</strong> para carregar os utentes elegíveis e os critérios de proximidade e tempo sem visita.
        </div>
      ) : (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <label className="form-label small fw-medium mb-0">
              3. Utentes ({selecionados.length} selecionados)
            </label>
            <div className="d-flex gap-1">
              <Dropdown autoClose="outside">
                <Dropdown.Toggle
                  variant="light"
                  size="sm"
                  aria-label="Filtrar utentes por localidade"
                >
                  {localidadesSelecionadas.length === 0
                    ? 'Todas as localidades'
                    : `${localidadesSelecionadas.length} localidade(s)`}
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <Form.Check
                    id="filtro-todas-localidades"
                    type="checkbox"
                    label="Todas as localidades"
                    checked={localidadesSelecionadas.length === 0}
                    onChange={() => setLocalidadesSelecionadas([])}
                  />
                  <hr className="my-2" />
                  {localidadesDisponiveis.map((localidade, index) => (
                    <Form.Check
                      key={localidade}
                      id={`filtro-localidade-${index}`}
                      type="checkbox"
                      label={localidade}
                      checked={localidadesSelecionadas.includes(localidade)}
                      onChange={() =>
                        setLocalidadesSelecionadas((atuais) =>
                          atuais.includes(localidade)
                            ? atuais.filter((item) => item !== localidade)
                            : [...atuais, localidade],
                        )
                      }
                    />
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <select
                aria-label="Ordenar utentes"
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={ordenacaoUtentes}
                onChange={(e) =>
                  setOrdenacaoUtentes(
                    e.target.value as 'PRIORIDADE_E_TEMPO' | 'MAIS_TEMPO_SEM_VISITA' | 'PROXIMIDADE',
                  )
                }
              >
                <option value="PRIORIDADE_E_TEMPO">Prioridade + há mais tempo</option>
                <option value="MAIS_TEMPO_SEM_VISITA">Mais dias sem visita</option>
                <option value="PROXIMIDADE">Mais próximo ({pontoReferencia.label})</option>
              </select>
            </div>
          </div>

          <div className="border rounded p-2 mb-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {utentesComCriterios.length === 0 && (
              <p className="small text-muted mb-0">
                Não existem utentes ativos para os filtros selecionados.
              </p>
            )}
            {utentesComCriterios.map(({ utente: u, diasSemVisita: dias, distRefKm }) => {
              const nivelPrioridade = getNivelPrioridade(u.prioridade);
              return (
                <div
                  key={u.id}
                  className="form-check py-1 border-bottom last-border-0 d-flex align-items-start gap-2"
                >
                  <input
                    id={`utente-rota-${u.id}`}
                    className="form-check-input mt-1"
                    type="checkbox"
                    checked={selecionados.includes(Number(u.id))}
                    onChange={() => alternarSelecionado(Number(u.id))}
                  />
                  <label
                    htmlFor={`utente-rota-${u.id}`}
                    className="form-check-label small flex-grow-1"
                  >
                    <div className="d-flex justify-content-between align-items-center gap-1">
                      <span className="fw-medium text-dark">{u.nome}</span>
                      <span
                        className="badge rounded-pill"
                        style={{
                          backgroundColor: nivelPrioridade?.corBg ?? '#6c757d',
                          color: nivelPrioridade?.corTexto ?? '#fff',
                          fontSize: '0.65rem',
                        }}
                      >
                        {u.prioridade}
                      </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      <span>{u.localidade || 'Sem localidade'}</span>
                      {' · '}
                      <strong className={dias !== null && dias >= 14 ? 'text-danger' : ''}>
                        {dias !== null ? `${dias}d sem visita` : 'Sem visita registada'}
                      </strong>
                      {distRefKm !== null && (
                        <>
                          {' · '}
                          <span>~{distRefKm} km em linha reta de {pontoReferencia.label}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {/* 5. Visualização por localidade e percurso de ida e regresso */}
          {utentesSelecionados.length > 0 && (
            <div className="bg-light rounded p-2 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-dark">
                  Ida e regresso ({BASE_BEJA.nome} → utentes selecionados → {BASE_BEJA.nome})
                </span>
                {distanciaEstimadaTotalKm !== null && (
                  <span className="badge bg-white text-dark border">
                    ~{distanciaEstimadaTotalKm} km em linha reta
                  </span>
                )}
              </div>

              <div className="d-flex flex-wrap gap-1 mb-2">
                {resumoPorLocalidade.map((item) => (
                  <span
                    key={item.localidade}
                    className="badge bg-success-subtle text-success border border-success-subtle"
                  >
                    {item.localidade}: {item.totalSelecionados} utente(s)
                  </span>
                ))}
              </div>

              <div className="small text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                Sequência: <strong>{BASE_BEJA.nome}</strong> →{' '}
                {utentesSelecionados.map((u) => `${u.nome} (${u.localidade || '—'})`).join(' → ')} →{' '}
                <strong>{BASE_BEJA.nome}</strong>
              </div>
              <div className="small text-muted mb-2">
                Pré-visualização em linha reta; não representa o percurso rodoviário.
              </div>
              {utentesSemCoordenadas.length > 0 && (
                <div className="alert alert-warning small py-2 mb-2" role="status">
                  Sem coordenadas no mapa/estimativa:{' '}
                  {utentesSemCoordenadas.map((utente) => utente.nome).join(', ')}.
                </div>
              )}

              {/* 4. Pré-visualização da rota no mapa antes de confirmar */}
              {coordenadasRota.length >= 2 && (
                <div className="rounded overflow-hidden border" style={{ height: '180px' }}>
                  <MapContainer
                    center={[BASE_BEJA.lat, BASE_BEJA.lng]}
                    zoom={9}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <AjustarVistaPrevia pontos={coordenadasRota} />
                    <Polyline
                      positions={coordenadasRota}
                      pathOptions={{ color: '#198754', weight: 3, dashArray: '6 4' }}
                    />
                    <CircleMarker
                      center={[BASE_BEJA.lat, BASE_BEJA.lng]}
                      radius={7}
                      pathOptions={{ color: '#0d6efd', fillColor: '#0d6efd', fillOpacity: 0.9 }}
                    >
                      <Tooltip permanent>{BASE_BEJA.nome} (Partida/Regresso)</Tooltip>
                    </CircleMarker>
                    {utentesSelecionados.map((u, idx) =>
                      u.lat !== null &&
                      u.lat !== undefined &&
                      u.lng !== null &&
                      u.lng !== undefined &&
                      obterCoordenadas(u) !== null ? (
                        <CircleMarker
                          key={u.id}
                          center={[u.lat, u.lng]}
                          radius={6}
                          pathOptions={{ color: '#198754', fillColor: '#198754', fillOpacity: 0.85 }}
                        >
                          <Tooltip>
                            {idx + 1}. {u.nome} ({u.localidade ?? '—'})
                          </Tooltip>
                        </CircleMarker>
                      ) : null,
                    )}
                  </MapContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="btn btn-success btn-sm w-100"
        disabled={aEnviar || !passoDesbloqueado || selecionados.length === 0}
        onClick={submeter}
      >
        {aEnviar ? 'A agendar volta...' : 'Confirmar e agendar volta'}
      </button>
      {erroAgendamento && (
        <div className="alert alert-danger small mt-2 mb-0" role="alert">
          {erroAgendamento}
        </div>
      )}
    </div>
  );
};

export default PainelConstrucaoRota;