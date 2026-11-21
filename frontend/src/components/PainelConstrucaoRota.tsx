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
  data: Date;
  equipas: Equipa[];
  equipaIdInicial?: number;
  viaturas: Viatura[];
  bloqueiosViaturas: BloqueioViatura[];
  viaturaIdInicial?: number;
  utentes: Utente[];
  voltasDoMes: Volta[];
  onCriada: () => void;
}

const BASE_BEJA: { lat: number; lng: number; nome: string } = {
  lat: 38.016,
  lng: -7.872,
  nome: 'Base Beja',
};

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

function obterCoordenadas(utente: Utente): [number, number] | null {
  if (
    !Number.isFinite(utente.lat) ||
    !Number.isFinite(utente.lng) ||
    (utente.lat === 0 && utente.lng === 0)
  ) {
    return null;
  }
  return [utente.lat, utente.lng];
}

function diasSemVisita(ultimaVisita?: string | null): number | null {
  if (!ultimaVisita) return null;
  const dt = parseISO(ultimaVisita);
  if (Number.isNaN(dt.getTime())) return null;
  return Math.max(0, differenceInCalendarDays(new Date(), dt));
}

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
  const voltasDesseDia = useMemo(
    () => voltasDoMes.filter((v) => v.data === diaIso && v.estado !== 'CANCELADA'),
    [voltasDoMes, diaIso],
  );

  const equipasDisponiveis = useMemo(
    () =>
      equipas.filter(
        (equipa) =>
          equipa.ativa && !voltasDesseDia.some((v) => v.equipaId === equipa.id),
      ),
    [equipas, voltasDesseDia],
  );

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
  const passoDesbloqueado = equipaDisponivel && viaturaSelecionadaDisponivel;

  const localidadesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    for (const u of utentes) {
      if (u.estado === 'Ativo' && u.localidade) conjunto.add(u.localidade);
    }
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [utentes]);

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
  const pontoReferencia = useMemo(() => {
    const ultimo = [...utentesSelecionados].reverse().find((utente) => obterCoordenadas(utente));
    const coordenadas = ultimo ? obterCoordenadas(ultimo) : null;
    if (ultimo && coordenadas) {
      return { lat: coordenadas[0], lng: coordenadas[1], label: ultimo.localidade || ultimo.nome };
    }
    return { lat: BASE_BEJA.lat, lng: BASE_BEJA.lng, label: BASE_BEJA.nome };
  }, [utentesSelecionados]);

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
        const ordemPrioridade = getNivelPrioridade(u.prioridade)?.ordem ?? 99;
        return {
          utente: u,
          diasSemVisita: dias,
          distRefKm: distRef,
          ordemPrioridade,
        };
      })
      .sort((a, b) => {
        if (ordenacaoUtentes === 'MAIS_TEMPO_SEM_VISITA') {
          const diasA = a.diasSemVisita ?? 9999;
          const diasB = b.diasSemVisita ?? 9999;
          if (diasB !== diasA) return diasB - diasA;
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        if (ordenacaoUtentes === 'PROXIMIDADE') {
          const dA = a.distRefKm ?? 9999;
          const dB = b.distRefKm ?? 9999;
          if (dA !== dB) return dA - dB;
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        if (a.ordemPrioridade !== b.ordemPrioridade) {
          return a.ordemPrioridade - b.ordemPrioridade;
        }
        const diasA = a.diasSemVisita ?? 9999;
        const diasB = b.diasSemVisita ?? 9999;
        return diasB - diasA;
      });
  }, [utentes, localidadesSelecionadas, ordenacaoUtentes, pontoReferencia]);

  // Agrupamento por localidade para visualização de ida e regresso
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
  const coordenadasRota = useMemo<[number, number][]>(() => {
    const coordsUtentes: [number, number][] = utentesSelecionados
      .map(obterCoordenadas)
      .filter((coordenadas): coordenadas is [number, number] => coordenadas !== null);

    if (coordsUtentes.length === 0) return [];
    return [[BASE_BEJA.lat, BASE_BEJA.lng], ...coordsUtentes, [BASE_BEJA.lat, BASE_BEJA.lng]];
  }, [utentesSelecionados]);

  const utentesSemCoordenadas = useMemo(
    () => utentesSelecionados.filter((utente) => obterCoordenadas(utente) === null),
    [utentesSelecionados],
  );

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

  const alternarSelecionado = (id: number) => {
    setErroAgendamento(null);
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((selecionadoId) => selecionadoId !== id) : [...atual, id],
    );
  };

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