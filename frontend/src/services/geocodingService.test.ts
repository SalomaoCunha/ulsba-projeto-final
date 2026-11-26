// Runtime validation coverage for: Nominatim geocoding lookups.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodeMorada } from './geocodingService';

describe('geocodeMorada', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the first suggested coordinate for a valid address', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [{ lat: '38.01500', lon: '-7.86500' }],
    } as Response);

    await expect(geocodeMorada('Rua de exemplo, Beja')).resolves.toEqual({ lat: 38.015, lng: -7.865 });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('nominatim.openstreetmap.org/search');
    expect(String(url)).toContain('countrycodes=pt');
    expect(String(url)).toContain(encodeURIComponent('Rua de exemplo, Beja'));
    expect(init?.headers).toMatchObject({ 'Accept-Language': 'pt-PT' });
  });

  it('returns null when there are no results', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [],
    } as Response);

    await expect(geocodeMorada('Morada inexistente qualquer coisa')).resolves.toBeNull();
  });

  it('returns null when the request fails with a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => [],
    } as Response);

    await expect(geocodeMorada('Rua de exemplo, Beja')).resolves.toBeNull();
  });

  it('returns null when the network request throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    await expect(geocodeMorada('Rua de exemplo, Beja')).resolves.toBeNull();
  });

  it('returns null when Nominatim returns malformed coordinates', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [{ lat: 'not-a-number', lon: '-7.865' }],
    } as Response);

    await expect(geocodeMorada('Rua de exemplo, Beja')).resolves.toBeNull();
  });

  it('returns null when the request is aborted by the timeout', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(geocodeMorada('Rua de exemplo, Beja')).resolves.toBeNull();
  });
});
