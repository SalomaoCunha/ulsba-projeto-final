// Geocodificação de moradas através do Nominatim (OpenStreetMap), gratuito e
// sem API key — usado para sugerir lat/lng ao criar um novo local, sempre
// sujeito a confirmação/correção manual no mapa (RF04/RF09).
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 8000;

// Limites de validade absolutos de coordenadas WGS84 — só para rejeitar
// respostas claramente malformadas do Nominatim; a validação de território
// (Portugal continental) é feita à parte, em coordenadasPortugal.ts.
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

interface ResultadoNominatim {
  lat: string;
  lon: string;
}

// Pede ao Nominatim uma sugestão de coordenadas para a morada indicada.
// Nunca lança exceção: sem resultados, coordenadas inválidas, timeout ou
// falha de rede/HTTP devolvem null, para o chamador cair no fluxo de
// colocação manual do pino.
export async function geocodeMorada(query: string): Promise<{ lat: number; lng: number } | null> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_SEARCH_URL}?format=jsonv2&limit=1&countrycodes=pt&q=${encodeURIComponent(query)}`;
    const resposta = await fetch(url, {
      headers: { 'Accept-Language': 'pt-PT' },
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      console.warn(`Geocodificação falhou: ${resposta.status} ${resposta.statusText}`);
      return null;
    }

    const resultados = (await resposta.json()) as ResultadoNominatim[];
    if (!Array.isArray(resultados) || resultados.length === 0) {
      return null;
    }

    const lat = parseFloat(resultados[0].lat);
    const lng = parseFloat(resultados[0].lon);
    const coordenadasValidas =
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= LAT_MIN && lat <= LAT_MAX &&
      lng >= LNG_MIN && lng <= LNG_MAX;
    if (!coordenadasValidas) {
      console.warn('Geocodificação devolveu coordenadas inválidas:', resultados[0]);
      return null;
    }

    return { lat, lng };
  } catch (erro) {
    console.warn('Falha de rede na geocodificação:', erro);
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}
