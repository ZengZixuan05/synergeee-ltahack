import { z } from 'zod';

// Confirmed live (2026-09-19): unlike every other endpoint implemented so
// far, `value` here is a single OBJECT, not an array — one snapshot of
// current network status, containing zero or more affected line segments
// and zero or more general advisory messages. This also settles an
// inconsistency in the LTA guide itself: Annex C's "disruption" screenshot
// shows `"value": {...}` (object) while its "normal scenario" screenshot
// shows `"value": [` (array) with content that isn't valid JSON as printed
// — the live response confirms the object form is correct.
const affectedSegmentSchema = z
  .object({
    Line: z.string().min(1),
    Direction: z.string().optional(),
    Stations: z.string().optional(),
    FreePublicBus: z.string().optional(),
    FreeMRTShuttle: z.string().optional(),
    MRTShuttleDirection: z.string().optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    Content: z.string(),
    CreatedDate: z.string(),
  })
  .passthrough();

export const trainServiceAlertsResponseSchema = z.object({
  value: z.object({
    Status: z.number(),
    AffectedSegments: z.array(affectedSegmentSchema).default([]),
    Message: z.array(messageSchema).default([]),
  }),
});

export type AffectedSegment = z.infer<typeof affectedSegmentSchema>;
export type TrainServiceAlertMessage = z.infer<typeof messageSchema>;
