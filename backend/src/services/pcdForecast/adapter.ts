import { LtaDataMallClient } from '../../lta/client';
import { PCD_TRAIN_LINE_CODES } from '../../models/railLine';

export interface RawPcdForecastByLine {
  trainLine: (typeof PCD_TRAIN_LINE_CODES)[number];
  raw: unknown;
}

/** Same per-line request shape as PCDRealTime, fetched sequentially for the same reason (see the full rationale in pcdRealTime/adapter.ts). */
export async function fetchAllPcdForecast(client: LtaDataMallClient): Promise<RawPcdForecastByLine[]> {
  const results: RawPcdForecastByLine[] = [];
  for (const trainLine of PCD_TRAIN_LINE_CODES) {
    const raw = await client.get('/PCDForecast', { params: { TrainLine: trainLine } });
    results.push({ trainLine, raw });
  }
  return results;
}
