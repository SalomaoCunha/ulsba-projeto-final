// Caixa delimitadora (bounding box) aproximada de Portugal Continental, usada para
// validar rapidamente se um par de coordenadas é plausível (não cobre Açores/Madeira).
export const LIMITES_PORTUGAL_CONTINENTAL = {
  latitudeMinima: 36.95,
  latitudeMaxima: 42.16,
  longitudeMinima: -9.55,
  longitudeMaxima: -6.18,
};

// Verifica se um par de coordenadas (lat/lng) cai dentro dos limites de Portugal
// Continental — usado para detetar coordenadas inválidas/erradas antes de as guardar ou desenhar no mapa.
export function coordenadasEmPortugalContinental(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= LIMITES_PORTUGAL_CONTINENTAL.latitudeMinima &&
    lat <= LIMITES_PORTUGAL_CONTINENTAL.latitudeMaxima &&
    lng >= LIMITES_PORTUGAL_CONTINENTAL.longitudeMinima &&
    lng <= LIMITES_PORTUGAL_CONTINENTAL.longitudeMaxima
  );
}
