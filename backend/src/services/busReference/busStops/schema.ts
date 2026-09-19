import { z } from 'zod';

// Matches the guide (section 2.4) exactly, confirmed live (2026-09-19):
// plain WGS84 lat/lng numbers — unlike the GeospatialWholeIsland shapefile
// layers, BusStops needs no SVY21 conversion.
export const busStopSchema = z
  .object({
    BusStopCode: z.string().min(1),
    RoadName: z.string().optional(),
    Description: z.string().optional(),
    Latitude: z.number(),
    Longitude: z.number(),
  })
  .passthrough();

export type BusStopRecord = z.infer<typeof busStopSchema>;
