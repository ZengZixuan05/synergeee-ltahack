import { z } from 'zod';

// Matches the guide (section 2.1) and a live sample (2026-09-19). The guide
// notes NextBus2/NextBus3 are "empty / blank" when fewer buses are on the
// road — every field here is optional/nullable-in-practice so an empty
// NextBus object still validates; normalise.ts decides whether a NextBus
// entry represents a real bus (EstimatedArrival present and non-empty).
const nextBusSchema = z
  .object({
    OriginCode: z.string().optional(),
    DestinationCode: z.string().optional(),
    EstimatedArrival: z.string().optional(),
    Monitored: z.union([z.number(), z.string()]).optional(),
    Latitude: z.string().optional(),
    Longitude: z.string().optional(),
    VisitNumber: z.union([z.number(), z.string()]).optional(),
    Load: z.string().optional(),
    Feature: z.string().optional(),
    Type: z.string().optional(),
  })
  .passthrough();

const busArrivalServiceSchema = z
  .object({
    ServiceNo: z.string().min(1),
    Operator: z.string(),
    NextBus: nextBusSchema.optional(),
    NextBus2: nextBusSchema.optional(),
    NextBus3: nextBusSchema.optional(),
  })
  .passthrough();

export const busArrivalResponseSchema = z.object({
  BusStopCode: z.string().optional(),
  // Defaulted rather than required: the guide says the API can return no
  // response at all (not even attribute tags) when buses aren't in service.
  Services: z.array(busArrivalServiceSchema).default([]),
});

export type BusArrivalServiceEntry = z.infer<typeof busArrivalServiceSchema>;
export type NextBusEntry = z.infer<typeof nextBusSchema>;
