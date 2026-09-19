import { z } from 'zod';

// Matches a live OneMap routeType=pt response (2026-09-19, Bedok -> SGH):
// an OpenTripPlanner-shaped `plan.itineraries[].legs[]`. Epoch-millisecond
// timestamps and encoded polyline geometry are normalised in normalise.ts,
// not here.
const stopSchema = z
  .object({
    name: z.string().optional(),
    stopCode: z.string().optional(),
    lon: z.number(),
    lat: z.number(),
  })
  .passthrough();

const legSchema = z
  .object({
    startTime: z.number(),
    endTime: z.number(),
    distance: z.number(),
    mode: z.string(),
    route: z.string().optional(),
    from: stopSchema,
    to: stopSchema,
    intermediateStops: z.array(stopSchema).optional(),
    legGeometry: z.object({ points: z.string() }).optional(),
  })
  .passthrough();

const itinerarySchema = z
  .object({
    duration: z.number(),
    startTime: z.number(),
    endTime: z.number(),
    walkDistance: z.number().optional(),
    transfers: z.number().optional(),
    fare: z.string().optional(),
    legs: z.array(legSchema),
  })
  .passthrough();

// `plan` is absent when OneMap finds no itinerary at all (observed
// undocumented — treated defensively as "no route found", not an error).
export const oneMapPtResponseSchema = z
  .object({
    plan: z
      .object({
        itineraries: z.array(itinerarySchema).default([]),
      })
      .optional(),
  })
  .passthrough();

export type RawStop = z.infer<typeof stopSchema>;
export type RawLeg = z.infer<typeof legSchema>;
export type RawItinerary = z.infer<typeof itinerarySchema>;
