import { RainfallReading } from '../../../models/weather';
import { rainfallResponseSchema } from './schema';
import { WeatherResponseShapeError } from '../../../weather/errors';

/**
 * Validates and normalises a raw /rainfall response into one RainfallReading
 * per station, using the CURRENT reading only (the endpoint returns one
 * 5-minute-total snapshot at a time in practice).
 */
export function normaliseRainfall(raw: unknown, fetchedAt: string): RainfallReading[] {
  const parsed = rainfallResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WeatherResponseShapeError('rainfall');
  }

  const { stations, readings } = parsed.data.data;
  const currentReading = readings[0];
  if (!currentReading) return [];

  const stationById = new Map(stations.map((s) => [s.id, s]));

  return currentReading.data
    .map((datum) => {
      const station = stationById.get(datum.stationId);
      if (!station) return null; // no metadata for this station id — skip rather than fabricate a name/location
      return {
        id: `rainfall:${datum.stationId}`,
        source: 'DataGovSg' as const,
        provenance: 'LIVE' as const,
        lastUpdated: fetchedAt,
        stationId: datum.stationId,
        stationName: station.name,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        valueMm: datum.value,
        timestamp: currentReading.timestamp,
      };
    })
    .filter((v): v is RainfallReading => v !== null);
}
