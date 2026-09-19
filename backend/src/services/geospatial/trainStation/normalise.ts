import { TrainStationFootprint } from '../../../models/geospatial';
import { RawGeoFeature } from '../../../lta/geospatial';
import { logError } from '../../../utils/logger';
import { buildGeospatialId, requireWgs84Geometry } from '../shared';
import { trainStationPropertiesSchema } from './schema';

const LAYER_ID = 'TrainStation';

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normaliseTrainStations(
  features: RawGeoFeature[],
  fetchedAt: string
): { records: TrainStationFootprint[]; skippedCount: number } {
  const records: TrainStationFootprint[] = [];
  let skippedCount = 0;

  features.forEach((feature, index) => {
    const parsed = trainStationPropertiesSchema.safeParse(feature.properties);
    if (!parsed.success) {
      skippedCount += 1;
      logError('geospatial.TrainStation.normalise.skip', parsed.error, { index });
      return;
    }

    const geometry = requireWgs84Geometry(feature, LAYER_ID, index);
    if (!geometry) {
      skippedCount += 1;
      return;
    }

    const name = nonEmpty(parsed.data.STN_NAM_DE);

    records.push({
      id: buildGeospatialId(LAYER_ID, index, name),
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      name,
      stationType: nonEmpty(parsed.data.TYP_CD_DES),
      attachmentReference: nonEmpty(parsed.data.ATTACHEMEN),
      geometry,
    });
  });

  return { records, skippedCount };
}
