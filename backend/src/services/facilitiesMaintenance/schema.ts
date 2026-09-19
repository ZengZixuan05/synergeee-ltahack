import { z } from 'zod';

// Mirrors the fields documented in the LTA DataMall API User Guide (v6.8),
// section 2.23 "FACILITIES MAINTENANCE": Line, StationCode, StationName,
// LiftID (optional), LiftDesc. `.passthrough()` preserves any additional
// fields LTA sends that aren't documented, without us inventing meaning for
// them — normalise.ts only reads the fields below.
export const facilitiesMaintenanceRecordSchema = z
  .object({
    Line: z.string().min(1),
    StationCode: z.string().min(1),
    StationName: z.string().min(1),
    LiftID: z.string().optional(),
    LiftDesc: z.string().optional(),
  })
  .passthrough();

export type RawFacilitiesMaintenanceRecord = z.infer<typeof facilitiesMaintenanceRecordSchema>;

// The LTA client's getAllPages() already unwraps the `value` array before
// this schema sees it, so this schema validates a single record. Each
// element of the array is validated independently in normalise.ts so one
// malformed record can't discard the rest of a page.
