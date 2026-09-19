import { z } from 'zod';

// Field names observed directly in a live GeospatialWholeIsland?ID=TrainStation
// response (2026-09-19) — this dataset's schema is not documented in the LTA
// guide at all, so nothing here is asserted beyond what was actually seen.
// Everything is optional except geometry (validated separately) since there
// is no guarantee every record carries every field (STN_NAM and ATTACHEMEN
// were both null on several observed records).
export const trainStationPropertiesSchema = z
  .object({
    STN_NAM_DE: z.string().nullable().optional(),
    TYP_CD_DES: z.string().nullable().optional(),
    ATTACHEMEN: z.string().nullable().optional(),
  })
  .passthrough();

export type TrainStationProperties = z.infer<typeof trainStationPropertiesSchema>;
