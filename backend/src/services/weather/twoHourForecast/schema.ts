import { z } from 'zod';

// Matches a live data.gov.sg /two-hr-forecast response (2026-09-19):
// { code, data: { area_metadata: [{name, label_location:{lat,lng}}], items: [{ valid_period, forecasts: [{area, forecast}] }] } }
const areaMetadataSchema = z
  .object({
    name: z.string(),
    label_location: z.object({ latitude: z.number(), longitude: z.number() }),
  })
  .passthrough();

const forecastEntrySchema = z
  .object({
    area: z.string(),
    forecast: z.string(),
  })
  .passthrough();

const itemSchema = z
  .object({
    valid_period: z.object({
      start: z.string(),
      end: z.string(),
    }),
    forecasts: z.array(forecastEntrySchema),
  })
  .passthrough();

export const twoHourForecastResponseSchema = z.object({
  data: z.object({
    area_metadata: z.array(areaMetadataSchema),
    items: z.array(itemSchema),
  }),
});

export type AreaMetadata = z.infer<typeof areaMetadataSchema>;
export type ForecastEntry = z.infer<typeof forecastEntrySchema>;
