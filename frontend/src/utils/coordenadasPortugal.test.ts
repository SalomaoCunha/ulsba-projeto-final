// Runtime validation coverage for: Portuguese continental coordinates.
import { describe, expect, it } from 'vitest';
import { coordenadasEmPortugalContinental } from './coordenadasPortugal';

describe('coordenadasEmPortugalContinental', () => {
  it('accepts coordinates in Beja and on the territory bounds', () => {
    expect(coordenadasEmPortugalContinental(38.016, -7.872)).toBe(true);
    expect(coordenadasEmPortugalContinental(36.95, -9.55)).toBe(true);
    expect(coordenadasEmPortugalContinental(42.16, -6.18)).toBe(true);
  });

  it('rejects coordinates outside the territory or non-finite values', () => {
    expect(coordenadasEmPortugalContinental(38.016, -10)).toBe(false);
    expect(coordenadasEmPortugalContinental(Number.NaN, -7.872)).toBe(false);
  });
});
