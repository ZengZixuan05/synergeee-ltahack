import { z } from 'zod';

// Confirmed live (2026-09-19) against `?TrainLine=EWL` — matches the guide
// (section 2.24) exactly: Station, StartTime, EndTime, CrowdLevel.
const pcdRealTimeItemSchema = z
  .object({
    Station: z.string().min(1),
    StartTime: z.string(),
    EndTime: z.string(),
    CrowdLevel: z.string(),
  })
  .passthrough();

export const pcdRealTimeResponseSchema = z.object({
  value: z.array(pcdRealTimeItemSchema),
});

export type PcdRealTimeItem = z.infer<typeof pcdRealTimeItemSchema>;
