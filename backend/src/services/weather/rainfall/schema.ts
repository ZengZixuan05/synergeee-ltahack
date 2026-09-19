import { z } from 'zod';

// Matches a live data.gov.sg /rainfall response (2026-09-19):
// { data: { stations: [{id, name, location:{lat,lng}}], readings: [{timestamp, data: [{stationId, value}]}], readingUnit: "mm" } }
const stationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location: z.object({ latitude: z.number(), longitude: z.number() }),
  })
  .passthrough();

const readingDatumSchema = z
  .object({
    stationId: z.string(),
    value: z.number(),
  })
  .passthrough();

const readingSchema = z
  .object({
    timestamp: z.string(),
    data: z.array(readingDatumSchema),
  })
  .passthrough();

export const rainfallResponseSchema = z.object({
  data: z.object({
    stations: z.array(stationSchema),
    readings: z.array(readingSchema),
  }),
});

export type Station = z.infer<typeof stationSchema>;
