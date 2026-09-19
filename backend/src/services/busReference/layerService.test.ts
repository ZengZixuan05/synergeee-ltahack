import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { PaginatedReferenceLayerService } from './layerService';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

interface FakeRecord {
  label: string;
}

function fakeNormalise(raw: unknown[]): { records: FakeRecord[]; skippedCount: number } {
  return { records: raw.map((r) => ({ label: String((r as { label?: string }).label) })), skippedCount: 0 };
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): PaginatedReferenceLayerService<FakeRecord> {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new PaginatedReferenceLayerService('/FakeLayer', client, fakeNormalise, 60_000);
}

describe('PaginatedReferenceLayerService', () => {
  it('returns LIVE_SUCCESS with normalised, fully-paginated records', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [{ label: 'a' }] })));
    const result = await makeService(fetchImpl).getLayer();

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.provenance).toBe('LIVE');
    expect(result.records).toEqual([{ label: 'a' }]);
  });

  it('returns LIVE_EMPTY when the layer has zero records', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const result = await makeService(fetchImpl).getLayer();
    expect(result.status).toBe('LIVE_EMPTY');
  });

  it('returns LIVE_ERROR (never demo data) on an LTA HTTP error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getLayer();
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
  });

  it('caches a successful result so a second call does not re-fetch', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const service = makeService(fetchImpl);
    await service.getLayer();
    await service.getLayer();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors, so a subsequent call retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 503 }));
    const service = makeService(fetchImpl);
    await service.getLayer();
    await service.getLayer();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('never lets the AccountKey leak into the result', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const result = await makeService(fetchImpl).getLayer();
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
