import { LtaDataMallClient } from '../../lta/client';
import { PCD_TRAIN_LINE_CODES } from '../../models/railLine';

export interface RawPcdRealTimeByLine {
  trainLine: (typeof PCD_TRAIN_LINE_CODES)[number];
  raw: unknown;
}

/**
 * PCDRealTime requires `TrainLine` as a mandatory request parameter and
 * returns only that line's stations, so network-wide coverage means one
 * call per known line code (see PCD_TRAIN_LINE_CODES). Each result is
 * tagged with the line it was queried under, since the response body
 * itself doesn't say which line was requested.
 *
 * Fetched sequentially, not via `Promise.all` — confirmed live
 * (2026-09-19): firing all 11 requests concurrently reliably triggered a
 * transient HTTP 500 from LTA on at least one of them, while the same 11
 * calls made one after another all succeeded every time. Not documented
 * anywhere; only discoverable by hitting it.
 */
export async function fetchAllPcdRealTime(client: LtaDataMallClient): Promise<RawPcdRealTimeByLine[]> {
  const results: RawPcdRealTimeByLine[] = [];
  for (const trainLine of PCD_TRAIN_LINE_CODES) {
    const raw = await client.get('/PCDRealTime', { params: { TrainLine: trainLine } });
    results.push({ trainLine, raw });
  }
  return results;
}
