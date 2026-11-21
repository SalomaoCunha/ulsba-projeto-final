export const LIMITES_PORTUGAL_CONTINENTAL = {
  latitudeMinima: 36.95,
  latitudeMaxima: 42.16,
  longitudeMinima: -9.55,
  longitudeMaxima: -6.18,
};

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
