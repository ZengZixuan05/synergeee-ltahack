import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { RawGeoFeature } from '../../lta/geospatial';
import { GeospatialLayerService } from './layerService';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

interface FakeRecord {
  label: string;
}

function fakeNormalise(features: RawGeoFeature[]): { records: FakeRecord[]; skippedCount: number } {
  return { records: features.map((f) => ({ label: String((f.properties as { label?: string })?.label) })), skippedCount: 0 };
}

function makeService(opts: {
  linkFetchImpl: ReturnType<typeof vi.fn>;
  parseShapefileFeaturesImpl?: (zipBuffer: Buffer) => Promise<RawGeoFeature[]>;
}): GeospatialLayerService<FakeRecord> {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl: opts.linkFetchImpl });
  return new GeospatialLayerService('FakeLayer', client, fakeNormalise, 60_000, {
    fetchImpl: opts.linkFetchImpl,
    parseShapefileFeaturesImpl: opts.parseShapefileFeaturesImpl ?? (async () => [{ type: 'Feature', properties: { label: 'a' }, geometry: null }]),
  });
}

function linkAndDownloadMock(): ReturnType<typeof vi.fn> {
  return vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ value: [{ Link: 'https://example.com/layer.zip' }] }))
    .mockResolvedValueOnce(new Response(new Uint8Array([1]).buffer));
}

describe('GeospatialLayerService', () => {
  it('returns LIVE_SUCCESS with normalised records for a non-empty layer', async () => {
    const service = makeService({ linkFetchImpl: linkAndDownloadMock() });
    const result = await service.getLayer();

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.provenance).toBe('LIVE');
    expect(result.records).toEqual([{ label: 'a' }]);
  });

  it('returns LIVE_EMPTY when the layer parses to zero features', async () => {
    const service = makeService({ linkFetchImpl: linkAndDownloadMock(), parseShapefileFeaturesImpl: async () => [] });
    const result = await service.getLayer();
    expect(result.status).toBe('LIVE_EMPTY');
    expect(result.records).toEqual([]);
  });

  it('returns LIVE_ERROR (never demo data) when the Link fetch fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const service = makeService({ linkFetchImpl: fetchImpl });
    const result = await service.getLayer();
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
    expect(result.errorMessage).toBeTruthy();
  });

  it('caches a successful result so a second call does not re-fetch', async () => {
    const fetchImpl = linkAndDownloadMock();
    const service = makeService({ linkFetchImpl: fetchImpl });

    await service.getLayer();
    await service.getLayer();

    expect(fetchImpl).toHaveBeenCalledTimes(2); // link + download, once total across both calls
  });

  it('does not cache errors, so a subsequent call retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 503 }));
    const service = makeService({ linkFetchImpl: fetchImpl });

    await service.getLayer();
    await service.getLayer();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('updates the diagnostics snapshot without needing another fetch', async () => {
    const service = makeService({ linkFetchImpl: linkAndDownloadMock() });
    await service.getLayer();
    const snapshot = service.getDiagnosticsSnapshot();
    expect(snapshot.lastStatus).toBe('LIVE_SUCCESS');
    expect(snapshot.lastRecordCount).toBe(1);
  });

  it('reports NOT_YET_CALLED before any request', () => {
    const service = makeService({ linkFetchImpl: vi.fn() });
    expect(service.getDiagnosticsSnapshot().lastStatus).toBe('NOT_YET_CALLED');
  });

  it('never lets the AccountKey leak into the result', async () => {
    const service = makeService({ linkFetchImpl: linkAndDownloadMock() });
    const result = await service.getLayer();
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
