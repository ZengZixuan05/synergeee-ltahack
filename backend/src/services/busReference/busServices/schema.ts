import { z } from 'zod';

// Matches the guide (section 2.2) and a live sample (2026-09-19) exactly.
export const busServiceSchema = z
  .object({
    ServiceNo: z.string().min(1),
    Operator: z.string(),
    Direction: z.number(),
    Category: z.string().optional(),
    OriginCode: z.string().optional(),
    DestinationCode: z.string().optional(),
    AM_Peak_Freq: z.string().optional(),
    AM_Offpeak_Freq: z.string().optional(),
    PM_Peak_Freq: z.string().optional(),
    PM_Offpeak_Freq: z.string().optional(),
    LoopDesc: z.string().optional(),
  })
  .passthrough();

export type BusServiceRecord = z.infer<typeof busServiceSchema>;
