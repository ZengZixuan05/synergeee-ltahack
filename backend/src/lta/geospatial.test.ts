import AdmZip from 'adm-zip';
import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from './client';
import { extractShapefileBuffers, fetchGeospatialLayerFeatures } from './geospatial';
import { LtaResponseShapeError } from './errors';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function buildFixtureZip(entryNames: string[]): Buffer {
  const zip = new AdmZip();
  for (const name of entryNames) {
    zip.addFile(name, Buffer.from('fixture content'));
  }
  return zip.toBuffer();
}

describe('extractShapefileBuffers', () => {
  it('finds the .shp/.dbf entry pair regardless of nesting or casing', () => {
    const zipBuffer = buildFixtureZip([
      'TrainStation_Mar2026/RapidTransitSystemStation.SHP',
      'TrainStation_Mar2026/RapidTransitSystemStation.dbf',
      'TrainStation_Mar2026/RapidTransitSystemStation.prj',
    ]);
    const { shp, dbf } = extractShapefileBuffers(zipBuffer);
    expect(shp.toString()).toBe('fixture content');
    expect(dbf.toString()).toBe('fixture content');
  });

  it('throws when the archive has no .shp/.dbf pair', () => {
    const zipBuffer = buildFixtureZip(['readme.txt']);
    expect(() => extractShapefileBuffers(zipBuffer)).toThrow(/did not contain a \.shp\/\.dbf pair/);
  });
});

describe('fetchGeospatialLayerFeatures', () => {
  it('fetches the Link, downloads the archive, and delegates parsing (mocked)', async () => {
    const fetchImpl = vi
      .fn()
      // 1st call: LtaDataMallClient's GET /GeospatialWholeIsland?ID=TrainStation
      .mockResolvedValueOnce(jsonResponse({ value: [{ Link: 'https://example.com/TrainStation.zip' }] }))
      // 2nd call: the raw S3 zip download
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]).buffer));

    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });
    const parseShapefileFeaturesImpl = vi.fn().mockResolvedValue([{ type: 'Feature', properties: { foo: 'bar' }, geometry: null }]);

    const features = await fetchGeospatialLayerFeatures(client, 'TrainStation', { fetchImpl, parseShapefileFeaturesImpl });

    expect(features).toEqual([{ type: 'Feature', properties: { foo: 'bar' }, geometry: null }]);
    expect(parseShapefileFeaturesImpl).toHaveBeenCalledTimes(1);
    const downloadedUrl = fetchImpl.mock.calls[1]![0];
    expect(downloadedUrl).toBe('https://example.com/TrainStation.zip');
  });

  it('throws LtaResponseShapeError when the Link response is missing or malformed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: [] }));
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    await expect(fetchGeospatialLayerFeatures(client, 'TrainStation', { fetchImpl })).rejects.toBeInstanceOf(
      LtaResponseShapeError
    );
  });

  it('throws when the archive download itself fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ value: [{ Link: 'https://example.com/TrainStation.zip' }] }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));

    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    await expect(fetchGeospatialLayerFeatures(client, 'TrainStation', { fetchImpl })).rejects.toThrow(
      /Failed to download geospatial layer archive/
    );
  });
});
