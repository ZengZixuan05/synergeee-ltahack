import { z } from 'zod';

// Confirmed live (2026-09-19) against `?TrainLine=EWL`: nested
// Date -> Stations[] -> Interval[] { Start, CrowdLevel } — the guide's field
// table (section 2.25) only implies this nesting; the live shape confirms
// it exactly (no `End` on each interval — they're consecutive 30-minute
// slots, per the guide's "30 minutes interval" description).
const intervalSchema = z
  .object({
    Start: z.string(),
    CrowdLevel: z.string(),
  })
  .passthrough();

const stationForecastSchema = z
  .object({
    Station: z.string().min(1),
    Interval: z.array(intervalSchema),
  })
  .passthrough();

const dateForecastSchema = z
  .object({
    Date: z.string(),
    Stations: z.array(stationForecastSchema),
  })
  .passthrough();

export const pcdForecastResponseSchema = z.object({
  value: z.array(dateForecastSchema),
});

export type DateForecast = z.infer<typeof dateForecastSchema>;
