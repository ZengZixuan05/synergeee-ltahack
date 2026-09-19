import { z } from 'zod';

// Matches the guide (section 2.3) and a live sample (2026-09-19) exactly.
export const busRouteStopSchema = z
  .object({
    ServiceNo: z.string().min(1),
    Operator: z.string(),
    Direction: z.number(),
    StopSequence: z.number(),
    BusStopCode: z.string().min(1),
    Distance: z.number().optional(),
    WD_FirstBus: z.string().optional(),
    WD_LastBus: z.string().optional(),
    SAT_FirstBus: z.string().optional(),
    SAT_LastBus: z.string().optional(),
    SUN_FirstBus: z.string().optional(),
    SUN_LastBus: z.string().optional(),
  })
  .passthrough();

export type BusRouteStopRecord = z.infer<typeof busRouteStopSchema>;
