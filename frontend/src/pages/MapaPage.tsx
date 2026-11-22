import React, { useEffect, useState } from 'react';
import MapaLeaflet from '../components/MapaLeaflet';
import FiltrosUtentesPainel from '../components/FiltrosUtentesPainel';
import EcraCarregamento from '../components/EcraCarregamento';
import { atualizarCoordenadasUtente, getUtentes } from '../services/utenteService';
import type { Utente } from '../types/utente';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import { filtrarUtentes, filtrosVazios, type FiltrosUtentes } from '../utils/filtrosUtentes';
import { coordenadasEmPortugalContinental, LIMITES_PORTUGAL_CONTINENTAL } from '../utils/coordenadasPortugal';

interface ResultadoValidacao {
  valido: boolean;
  lat: number | null;
  lng: number | null;
  trocadas: boolean; // true quando lat/lng parecem estar trocadas entre si (ver abaixo)
  mensagem: string | null;
}

// Valida o texto introduzido para latitude/longitude ao marcar/corrigir a
// localização de um utente, garantindo que o ponto cai dentro de Portugal
// continental. Devolve sempre um objeto com o resultado e, quando inválido,
// uma mensagem explicativa pronta a mostrar ao utilizador.
function validarCoordenadasPortugal(latTexto: string, lngTexto: string): ResultadoValidacao {
  if (!latTexto.trim() || !lngTexto.trim()) {
    return {
      valido: false,
      lat: null,
      lng: null,
      trocadas: false,
      mensagem: 'Indique a latitude e a longitude ou clique num ponto no mapa.',
    };
  }

  const lat = Number(latTexto.trim().replace(',', '.'));
  const lng = Number(lngTexto.trim().replace(',', '.'));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      valido: false,
      lat: null,
      lng: null,
      trocadas: false,
      mensagem: 'Introduza valores numéricos válidos para a latitude e a longitude.',
    };
  }

  // Deteta o erro comum de trocar latitude com longitude: verifica se o valor
  // dado como "lng" cai nos limites válidos de latitude e o valor dado como
  // "lat" cai nos limites válidos de longitude — ou seja, se os dois valores
  // estiverem trocados entre si, o resultado ainda assim cairia dentro de
  // Portugal continental. Quando isso acontece, avisa-se o utilizador em vez
  // de aceitar silenciosamente coordenadas incorretas.
  if (
    lng >= LIMITES_PORTUGAL_CONTINENTAL.latitudeMinima &&
    lng <= LIMITES_PORTUGAL_CONTINENTAL.latitudeMaxima &&
    lat >= LIMITES_PORTUGAL_CONTINENTAL.longitudeMinima &&
    lat <= LIMITES_PORTUGAL_CONTINENTAL.longitudeMaxima
  ) {
    return {
      valido: false,
      lat,
      lng,
      trocadas: true,
      mensagem:
        'Coordenadas inválidas: a latitude e a longitude parecem estar trocadas. Em Portugal continental a latitude situa-se entre 36.95 e 42.16 e a longitude entre -9.55 e -6.18.',
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      valido: false,
      lat,
      lng,
      trocadas: false,
      mensagem:
        'Coordenadas fora dos limites geográficos válidos (latitude entre -90 e 90, longitude entre -180 e 180).',
    };
  }

  if (!coordenadasEmPortugalContinental(lat, lng)) {
    return {
      valido: false,
      lat,
      lng,
      trocadas: false,
      mensagem:
        'Coordenadas fora de Portugal continental. A latitude deve estar entre 36.95 e 42.16 e a longitude entre -9.55 e -6.18.',
    };
  }

  return { valido: true, lat, lng, trocadas: false, mensagem: null };
}

// Página do Mapa de Utentes: mostra os utentes georreferenciados no Leaflet,
// permite filtrá-los (RF16/RF17) e, em "modo de edição" (RF04), marcar ou
// corrigir manualmente as coordenadas de um utente — por formulário ou
// clicando num ponto do mapa.
const MapaPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [filtros, setFiltros] = useState<FiltrosUtentes>(filtrosVazios);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Estado da edição manual de coordenadas (RF04)
  const [modoEdicao, setModoEdicao] = useState(false);
  const [utenteSelecionadoId, setUtenteSelecionadoId] = useState<string>('');
  const [latTexto, setLatTexto] = useState('');
  const [lngTexto, setLngTexto] = useState('');
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    comAtrasoMinimo(getUtentes())
      .then(setUtentes)
      .finally(() => setCarregando(false));
  }, []);

  // Lista de utentes já filtrada (RF16/RF17); é esta lista — e não `utentes`
  // diretamente — que alimenta o mapa e os contadores abaixo.
  const utentesFiltrados = filtrarUtentes(utentes, filtros);

  // Contadores alinhados com o conjunto visível (RF16 e RF17)
  const totalNoMapa = utentesFiltrados.filter((u) => u.lat !== null && u.lng !== null).length;
  const totalUrgentes = utentesFiltrados.filter((u) => {
    const p = u.prioridade.trim().toLowerCase();
    return Boolean(p) && !p.includes('não urgente') && !p.includes('nao urgente');
  }).length;
  const totalNaoUrgentes = utentesFiltrados.filter((u) => {
    const p = u.prioridade.trim().toLowerCase();
    return p.includes('não urgente') || p.includes('nao urgente');
  }).length;

  // Revalida as coordenadas sempre que o texto digitado muda, para dar
  // feedback imediato (campo inválido, mensagem de erro, botão de troca).
  const validacao = validarCoordenadasPortugal(latTexto, lngTexto);
  // Ponto a mostrar no mapa como pré-visualização da nova localização,
  // apenas quando os valores digitados já são numéricos (mesmo que ainda
  // não validem como estando dentro de Portugal continental).
  const pontoEdicao =
    validacao.lat !== null && validacao.lng !== null
      ? { lat: validacao.lat, lng: validacao.lng }
      : null;

  // Entra em modo de edição já com um utente escolhido (ex.: a partir de um
  // clique num marcador do mapa) e pré-preenche o formulário com as suas
  // coordenadas atuais.
  const abrirEdicaoParaUtente = (utente: Utente) => {
    setModoEdicao(true);
    setUtenteSelecionadoId(String(utente.id));
    setLatTexto(utente.lat !== null ? String(utente.lat) : '');
    setLngTexto(utente.lng !== null ? String(utente.lng) : '');
    setErroApi(null);
    setSucessoMsg(null);
  };

  // Liga/desliga o painel de edição de coordenadas. Ao abrir, se ainda não
  // houver nenhum utente selecionado, pré-seleciona o primeiro da lista para
  // que o formulário não apareça vazio.
  const alternarModoEdicao = () => {
    if (modoEdicao) {
      setModoEdicao(false);
      setErroApi(null);
      return;
    }
    setModoEdicao(true);
    setErroApi(null);
    setSucessoMsg(null);
    if (!utenteSelecionadoId && utentes.length > 0) {
      const primeiro = utentes[0];
      setUtenteSelecionadoId(String(primeiro.id));
      setLatTexto(primeiro.lat !== null ? String(primeiro.lat) : '');
      setLngTexto(primeiro.lng !== null ? String(primeiro.lng) : '');
    }
  };

  // Ao trocar o utente selecionado no formulário, repõe os campos de
  // latitude/longitude com as coordenadas já guardadas para esse utente
  // (ou vazios, se ainda não tiver nenhuma).
  const handleTrocarUtente = (novoId: string) => {
    setUtenteSelecionadoId(novoId);
    setErroApi(null);
    setSucessoMsg(null);
    const encontrado = utentes.find((u) => String(u.id) === novoId);
    if (encontrado) {
      setLatTexto(encontrado.lat !== null ? String(encontrado.lat) : '');
      setLngTexto(encontrado.lng !== null ? String(encontrado.lng) : '');
    } else {
      setLatTexto('');
      setLngTexto('');
    }
  };

  // Chamado pelo MapaLeaflet quando o utilizador clica num ponto do mapa em
  // modo de edição: preenche os campos de texto com as coordenadas clicadas.
  const handleSelecionarPontoMapa = (lat: number, lng: number) => {
    setLatTexto(String(lat));
    setLngTexto(String(lng));
    setErroApi(null);
    setSucessoMsg(null);
  };

  // Atalho para corrigir o erro de latitude/longitude trocadas detetado pela
  // validação, sem o utilizador ter de reescrever os valores manualmente.
  const handleTrocarLatLng = () => {
    setLatTexto(lngTexto);
    setLngTexto(latTexto);
    setErroApi(null);
  };

  // Submete as coordenadas validadas para a API e, em caso de sucesso,
  // recarrega toda a lista de utentes (RF06) — necessário porque outros
  // utentes podem partilhar o mesmo local/morada e por isso o seu ponto no
  // mapa também pode ter mudado.
  const handleGuardarCoordenadas = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi(null);
    setSucessoMsg(null);

    if (!utenteSelecionadoId) {
      setErroApi('Selecione primeiro o utente cujo local pretende georreferenciar.');
      return;
    }

    if (!validacao.valido || validacao.lat === null || validacao.lng === null) {
      setErroApi(validacao.mensagem ?? 'Coordenadas inválidas.');
      return;
    }

    setAGuardar(true);
    try {
      const atualizado = await atualizarCoordenadasUtente(
        utenteSelecionadoId,
        validacao.lat,
        validacao.lng,
      );
      // Recarrega a lista para refletir também outros utentes que partilhem o mesmo local (RF06)
      const listaAtualizada = await getUtentes();
      setUtentes(listaAtualizada);
      setSucessoMsg(
        `Coordenadas de ${atualizado.nome} atualizadas para (${validacao.lat.toFixed(5)}, ${validacao.lng.toFixed(5)}).`,
      );
      setModoEdicao(false);
    } catch (err) {
      setErroApi(err instanceof Error ? err.message : 'Erro ao guardar as coordenadas.');
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
    <div className="d-flex flex-column min-vh-100 pb-3">
      {/* Cabeçalho */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Mapa de Utentes</h1>
          <p className="text-muted mb-0 small">
            Distribuição geográfica dos utentes por prioridade de atendimento
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn d-flex align-items-center gap-2 ${
              modoEdicao ? 'btn-primary' : 'btn-outline-primary'
            }`}
            onClick={alternarModoEdicao}
          >
            <i className="bi bi-geo-alt-fill"></i>
            {modoEdicao ? 'Fechar Edição de Coordenadas' : 'Marcar / Corrigir Coordenadas'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          >
            <i className="bi bi-funnel"></i> Filtros
          </button>
        </div>
      </div>

      {/* Feedback de sucesso */}
      {sucessoMsg && (
        <div className="alert alert-success alert-dismissible fade show py-2 small mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {sucessoMsg}
          <button
            type="button"
            className="btn-close py-2"
            aria-label="Fechar"
            onClick={() => setSucessoMsg(null)}
          ></button>
        </div>
      )}

      {/* Painel de Filtros */}
      {filtrosAbertos && (
        <div className="card shadow-sm border-0 bg-white mb-3">
          <FiltrosUtentesPainel utentes={utentes} filtros={filtros} onChange={setFiltros} />
        </div>
      )}

      {/* Painel de Marcação / Correção de Coordenadas (RF04) */}
      {modoEdicao && (
        <div className="card shadow-sm border-primary border-opacity-25 bg-white mb-3">
          <div className="card-body p-3">
            <form onSubmit={handleGuardarCoordenadas}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-4">
                  <label className="form-label small fw-medium text-muted mb-1">
                    Utente / Local a georreferenciar
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={utenteSelecionadoId}
                    onChange={(e) => handleTrocarUtente(e.target.value)}
                    required
                  >
                    <option value="">Selecione um utente...</option>
                    {utentes.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.numeroUtente} — {u.nome}
                        {u.lat === null || u.lng === null ? ' (sem coordenadas)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-sm-4 col-lg-3">
                  <label className="form-label small fw-medium text-muted mb-1">
                    Latitude (Norte)
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${
                      latTexto && !validacao.valido ? 'is-invalid' : ''
                    }`}
                    placeholder="Ex: 38.01500"
                    value={latTexto}
                    onChange={(e) => {
                      setLatTexto(e.target.value);
                      setErroApi(null);
                    }}
                  />
                </div>

                <div className="col-6 col-sm-4 col-lg-3">
                  <label className="form-label small fw-medium text-muted mb-1">
                    Longitude (Oeste)
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${
                      lngTexto && !validacao.valido ? 'is-invalid' : ''
                    }`}
                    placeholder="Ex: -7.86300"
                    value={lngTexto}
                    onChange={(e) => {
                      setLngTexto(e.target.value);
                      setErroApi(null);
                    }}
                  />
                </div>

                <div className="col-12 col-sm-4 col-lg-2 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success btn-sm flex-grow-1"
                    disabled={aGuardar}
                  >
                    <i className="bi bi-save me-1"></i>
                    {aGuardar ? 'A guardar...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-light btn-sm border"
                    onClick={() => setModoEdicao(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {(erroApi || ((latTexto || lngTexto) && !validacao.valido && validacao.mensagem)) && (
                <div className="alert alert-danger py-2 px-3 small mt-3 mb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <span>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {erroApi ?? validacao.mensagem}
                  </span>
                  {validacao.trocadas && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger bg-white"
                      onClick={handleTrocarLatLng}
                    >
                      <i className="bi bi-arrow-left-right me-1"></i>
                      Trocar lat / lng
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Mapa */}
      {/* Altura explícita (não percentagem): o Leaflet fica dentro de um .card com h-100,
          mas uma div com apenas flex-grow não dá uma altura "definida" aos filhos em
          percentagem, e o mapa fica com 0px de altura. */}
      <div style={{ height: 'max(450px, calc(100vh - 280px))' }}>
        <MapaLeaflet
          utentes={utentesFiltrados}
          modoEdicao={modoEdicao}
          pontoEdicao={pontoEdicao}
          pontoEdicaoValido={validacao.valido}
          onSelecionarPonto={handleSelecionarPontoMapa}
          onIniciarEdicaoUtente={abrirEdicaoParaUtente}
          onToggleFiltros={() => setFiltrosAbertos((prev) => !prev)}
        />
      </div>

      {/* Barra de Contadores (RF16 e RF17) */}
      <div className="card shadow-sm border-0 mt-3">
        <div className="card-body py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-3 small text-muted">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <div className="lh-1">Utentes no mapa</div>
              <strong className="text-dark fs-6">{totalNoMapa}</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <div className="lh-1">Urgentes</div>
              <strong className="text-dark fs-6">{totalUrgentes}</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-clock-fill"></i>
            </div>
            <div>
              <div className="lh-1">Não urgentes</div>
              <strong className="text-dark fs-6">{totalNaoUrgentes}</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center p-2">
              <i className="bi bi-geo-alt"></i>
            </div>
            <div>
              <div className="lh-1">Distância total</div>
              <strong className="text-dark">Por calcular</strong>{' '}
              <span className="text-muted">(sem volta selecionada)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPage;