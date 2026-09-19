import { z } from 'zod';

// Field names observed live (2026-09-19): CoveredLinkWay carries only
// `OBJECTID` — no name, description, or shelter-type attribute of any kind.
export const coveredLinkWayPropertiesSchema = z
  .object({
    OBJECTID: z.number().optional(),
  })
  .passthrough();

export type CoveredLinkWayProperties = z.infer<typeof coveredLinkWayPropertiesSchema>;
