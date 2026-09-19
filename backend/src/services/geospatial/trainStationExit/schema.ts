import { z } from 'zod';

// Field names observed directly in a live GeospatialWholeIsland?ID=TrainStationExit
// response (2026-09-19): `stn_name`, `exit_code` — lowercase, unlike
// TrainStation's `STN_NAM_DE`/`TYP_CD_DES`. That casing/naming difference is
// real, not a typo here — see the cross-layer note in models/geospatial.ts.
export const trainStationExitPropertiesSchema = z
  .object({
    stn_name: z.string().nullable().optional(),
    exit_code: z.string().nullable().optional(),
  })
  .passthrough();

export type TrainStationExitProperties = z.infer<typeof trainStationExitPropertiesSchema>;
