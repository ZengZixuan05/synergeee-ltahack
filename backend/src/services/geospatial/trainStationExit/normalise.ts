import { TrainStationExitPoint } from '../../../models/geospatial';
import { RawGeoFeature } from '../../../lta/geospatial';
import { logError } from '../../../utils/logger';
import { buildGeospatialId, requireWgs84Geometry } from '../shared';
import { trainStationExitPropertiesSchema } from './schema';

const LAYER_ID = 'TrainStationExit';

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normaliseTrainStationExits(
  features: RawGeoFeature[],
  fetchedAt: string
): { records: TrainStationExitPoint[]; skippedCount: number } {
  const records: TrainStationExitPoint[] = [];
  let skippedCount = 0;

  features.forEach((feature, index) => {
    const parsed = trainStationExitPropertiesSchema.safeParse(feature.properties);
    if (!parsed.success) {
      skippedCount += 1;
      logError('geospatial.TrainStationExit.normalise.skip', parsed.error, { index });
      return;
    }

    const geometry = requireWgs84Geometry(feature, LAYER_ID, index);
    if (!geometry) {
      skippedCount += 1;
      return;
    }

    const stationName = nonEmpty(parsed.data.stn_name);
    const exitCode = nonEmpty(parsed.data.exit_code);

    records.push({
      id: buildGeospatialId(LAYER_ID, index, stationName && exitCode ? `${stationName}-${exitCode}` : stationName),
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      stationName,
      exitCode,
      geometry,
    });
  });

  return { records, skippedCount };
}
