import AdmZip from 'adm-zip';
import * as shapefile from 'shapefile';
import { z } from 'zod';
import { LtaDataMallClient } from './client';
import { LtaResponseShapeError } from './errors';

// ---------------------------------------------------------------------------
// GeospatialWholeIsland (section 2.22 of the LTA guide) is structurally
// unlike every OData JSON endpoint: it returns `{ value: [{ Link }] }`,
// where `Link` is a presigned S3 URL (confirmed live: expires in 300s) to a
// ZIP of an ESRI shapefile (.shp geometry + .dbf attribute table, plus
// .prj/.shx/etc we don't need). This module downloads that ZIP, extracts
// the .shp/.dbf pair, and parses them into GeoJSON features — still in
// SVY21 coordinates; conversion to WGS84 happens in each layer's normalise
// step (src/geo/svy21.ts), not here.
// ---------------------------------------------------------------------------

const geospatialLinkResponseSchema = z.object({
  value: z.array(z.object({ Link: z.string().url() })).min(1),
});

export interface RawGeoFeature {
  type: 'Feature';
  properties: Record<string, unknown> | null;
  geometry: unknown;
}

export interface GeospatialFetchDeps {
  fetchImpl?: typeof fetch;
  /** Override point for tests — skip the real zip download + shapefile binary parsing entirely. */
  parseShapefileFeaturesImpl?: (zipBuffer: Buffer) => Promise<RawGeoFeature[]>;
}

async function fetchLayerLink(client: LtaDataMallClient, layerId: string): Promise<string> {
  const body = await client.get('/GeospatialWholeIsland', { params: { ID: layerId } });
  const parsed = geospatialLinkResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new LtaResponseShapeError(`/GeospatialWholeIsland?ID=${layerId}`);
  }
  return parsed.data.value[0]!.Link;
}

async function downloadZip(link: string, fetchImpl: typeof fetch): Promise<Buffer> {
  const response = await fetchImpl(link);
  if (!response.ok) {
    // Not an LtaHttpError: this request goes straight to S3, not to LTA's own API.
    throw new Error(`Failed to download geospatial layer archive (HTTP ${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Extracts the first .shp/.dbf entry pair found in the archive, wherever nested inside it (observed live: always inside one top-level folder, whose name varies by layer/export date). */
export function extractShapefileBuffers(zipBuffer: Buffer): { shp: Buffer; dbf: Buffer } {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const shpEntry = entries.find((e) => e.entryName.toLowerCase().endsWith('.shp'));
  const dbfEntry = entries.find((e) => e.entryName.toLowerCase().endsWith('.dbf'));
  if (!shpEntry || !dbfEntry) {
    throw new Error('Geospatial layer archive did not contain a .shp/.dbf pair');
  }
  return { shp: shpEntry.getData(), dbf: dbfEntry.getData() };
}

async function parseShapefileFeatures(zipBuffer: Buffer): Promise<RawGeoFeature[]> {
  const { shp, dbf } = extractShapefileBuffers(zipBuffer);
  const collection = await shapefile.read(shp, dbf);
  return collection.features as unknown as RawGeoFeature[];
}

/**
 * Fetches and parses one GeospatialWholeIsland layer (by its Annex E layer
 * ID, e.g. "TrainStation") into raw GeoJSON features. Coordinates are still
 * in SVY21 at this point — callers normalise per-layer, converting via
 * src/geo/svy21.ts.
 */
export async function fetchGeospatialLayerFeatures(
  client: LtaDataMallClient,
  layerId: string,
  deps: GeospatialFetchDeps = {}
): Promise<RawGeoFeature[]> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const parse = deps.parseShapefileFeaturesImpl ?? parseShapefileFeatures;

  const link = await fetchLayerLink(client, layerId);
  const zipBuffer = await downloadZip(link, fetchImpl);
  return parse(zipBuffer);
}
