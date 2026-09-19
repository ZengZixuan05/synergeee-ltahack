import { CoveredLinkwaySegment } from '../../../models/geospatial';
import { RawGeoFeature } from '../../../lta/geospatial';
import { logError } from '../../../utils/logger';
import { buildGeospatialId, requireWgs84Geometry } from '../shared';
import { coveredLinkWayPropertiesSchema } from './schema';

const LAYER_ID = 'CoveredLinkWay';

export function normaliseCoveredLinkWay(
  features: RawGeoFeature[],
  fetchedAt: string
): { records: CoveredLinkwaySegment[]; skippedCount: number } {
  const records: CoveredLinkwaySegment[] = [];
  let skippedCount = 0;

  features.forEach((feature, index) => {
    const parsed = coveredLinkWayPropertiesSchema.safeParse(feature.properties);
    if (!parsed.success) {
      skippedCount += 1;
      logError('geospatial.CoveredLinkWay.normalise.skip', parsed.error, { index });
      return;
    }

    const geometry = requireWgs84Geometry(feature, LAYER_ID, index);
    if (!geometry) {
      skippedCount += 1;
      return;
    }

    records.push({
      id: buildGeospatialId(LAYER_ID, index, parsed.data.OBJECTID),
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      objectId: parsed.data.OBJECTID,
      geometry,
    });
  });

  return { records, skippedCount };
}
