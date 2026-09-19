# Journey Planning (OneMap + live LTA data)

This is the backend's answer to the hackathon spec's mandatory **Route
Planning** capability (Problem Statement 2, section 3.2.1): "the app must
plan an actual journey... multi-modal... door to door... responsive to live
conditions... with the uncertainty made visible." It is a second, independent
third-party integration alongside LTA DataMall — see
[`LTA_INTEGRATION.md`](./LTA_INTEGRATION.md) for that one.

## Why OneMap, not a self-hosted OSRM/GraphHopper/Valhalla

The spec explicitly says "you may build routing on top of an existing engine
... we are not asking you to invent a shortest-path algorithm" and separately
calls out "OneMap's routing API is also fair game alongside your own." Its
`pt` (public transport) mode was confirmed live (2026-09-19) to be
**OpenTripPlanner-shaped** — the response's own field names
(`numItineraries`, `elevationMetadata`, `debugOutput`) are OTP's vocabulary,
not something OneMap invented. That means it's already a real,
schedule-aware, multi-modal graph engine — exactly the class of "existing
engine" the spec points at — with zero infrastructure to host. Self-hosting
OSRM/GraphHopper/Valhalla was the alternative considered; it was rejected for
this milestone because those are road/foot/bike engines, not transit-aware,
so multi-modal rail+bus routing would still have needed a separate GTFS-based
planner on top — essentially rebuilding what OneMap already provides.

This does not replace OpenStreetMap as the geospatial base (spec 3.2.2) —
that's the frontend's map tiles (already OSM via OpenFreeMap/MapLibre, per
the frontend's existing `/directions` screen). OneMap is the routing engine;
OSM is still the map.

## What was verified live before building anything

A real call to `GET /api/public/routingsvc/route?routeType=pt` for Mdm Lim's
actual journey (Sky Eden @ Bedok → Singapore General Hospital) returned a
genuine door-to-door itinerary: **RAIL (Bedok → Outram Park, East-West Line)
→ WALK → BUS 174 → WALK**, with three ranked alternatives. Two findings from
that call drove the whole design:

1. **OneMap's `stopCode` values are the exact same codes LTA DataMall
   uses** — the RAIL leg's `from.stopCode` was `"EW5"` (Bedok) and
   `to.stopCode` was `"EW16"` (Outram Park); the BUS leg's stops were
   `"06029"`/`"05119"`, LTA's own 5-digit bus stop codes. This is what makes
   live enrichment possible at all: it's a direct code match, not a
   name-based fuzzy join like the GeospatialWholeIsland layers needed (see
   "Geospatial layers" in `LTA_INTEGRATION.md`, where no such code was
   available).
2. **A fourth line-code vocabulary.** The RAIL leg reported `route: "EW"` —
   neither TrainServiceAlerts' `"EWL"`, StationCrowdDensity's `"EWL"`, nor
   FacilitiesMaintenance's `"BPLRT"`-style variants. Added as a new
   `OneMapRouting` source in `src/models/railLine.ts`, mapping the
   well-established 2-letter MRT trunk prefixes (`EW`→`EWL`, `NS`→`NSL`,
   etc.) to the same canonical lines. Sengkang/Punggol LRT are deliberately
   left unmapped for this source — an OTP-based system typically models an
   LRT loop by branch (`SE`/`SW` or similar), and that split was never
   observed live, so it isn't guessed.

Geometry (`legGeometry.points`) turned out to be the same encoded-polyline
format Google Maps uses (`src/geo/polyline.ts`, precision 5) — decoded and
verified against a known real coordinate (a WALK leg's first point landed
within 3 decimal places of Outram Park MRT's actual location).

## Architecture

```
OneMap routing service (HTTPS)
      ↓
OneMapClient                 src/onemap/client.ts    — auth (static key or email/password token), timeout, error types
      ↓
adapter                      src/services/journeyPlanning/adapter.ts
      ↓
schema validation            src/services/journeyPlanning/schema.ts   — zod schema for OneMap's OTP-shaped `pt` response
      ↓
normalisation                src/services/journeyPlanning/normalise.ts — raw itinerary → JourneyItinerary (src/geo/polyline.ts decodes geometry)
      ↓
enrichment                   src/services/journeyPlanning/enrich.ts   — cross-references each RAIL leg's station codes against
                                                                          TrainServiceAlerts / FacilitiesMaintenance / PCDRealTime
                                                                          (the SAME already-running, already-cached LTA services —
                                                                          no extra LTA calls beyond what they make on their own schedule)
      ↓
recommendation                src/services/journeyPlanning/recommend.ts — picks the first disruption/lift-warning-free itinerary, with a reason
      ↓
service (cache + status)      src/services/journeyPlanning/service.ts
      ↓
backend endpoint               GET /api/journey/plan
      ↓
frontend (later — not wired up in this milestone)
```

## Domain model (`src/models/journey.ts`)

`JourneyLeg` is a discriminated union: `WalkJourneyLeg`, `RailJourneyLeg`,
`BusJourneyLeg`. Only `RailJourneyLeg` carries a `live` field
(`RailLegLiveStatus`) — populated by enrichment, absent before it runs (never
a fabricated "all clear"). `JourneyItinerary.hasDisruption` /
`.hasLiftWarning` summarise across all of that itinerary's rail legs, and
`JourneyPlanResult.recommendation` is a `{ index, reason }` pointing at one
of the returned itineraries with a plain-language explanation — the concrete
mechanism behind "the app should say why it changed."

**Bus legs are not live-enriched in this milestone.** `BusArrival` (the only
live bus data this backend has) is a per-bus-stop query with no
"fetch-everything" mode — enriching every bus leg of every itinerary would
mean one extra LTA call per bus leg per plan request. Documented as a known
limitation rather than silently skipped.

## Response shape of `GET /api/journey/plan`

```
GET /api/journey/plan?from=1.324113,103.930363&to=1.279367,103.834854[&date=MM-DD-YYYY&time=HH:mm:ss&maxWalkDistance=&numItineraries=3]
```

`from`/`to` are required, `"lat,lng"`, validated before any OneMap call is
made (400 otherwise). `date`/`time` default to right now.

```jsonc
{
  "status": "LIVE_SUCCESS",       // "LIVE_SUCCESS" | "LIVE_EMPTY" | "LIVE_ERROR"
  "provenance": "LIVE",
  "fetchedAt": "2026-09-19T03:32:36.561Z",
  "from": { "latitude": 1.324113, "longitude": 103.930363 },
  "to": { "latitude": 1.279367, "longitude": 103.834854 },
  "itineraries": [
    {
      "durationSeconds": 2065,
      "fare": "2.02",
      "transfers": 1,
      "hasDisruption": false,
      "hasLiftWarning": false,
      "legs": [
        {
          "mode": "RAIL",
          "line": "EWL", "rawLine": "EW",
          "fromStationCode": "EW5", "fromStationName": "BEDOK MRT STATION",
          "toStationCode": "EW16", "toStationName": "OUTRAM PARK MRT STATION",
          "geometry": { "type": "LineString", "coordinates": [[103.930..., 1.324...], ...] },
          "live": { "disrupted": false, "liftWarnings": [], "crowding": [{ "stationCode": "EW5", "crowdLevel": "LOW" }, ...] }
        },
        { "mode": "WALK", "fromName": "OUTRAM PARK MRT STATION", "toName": "OUTRAM PK STN EXIT 1", "...": "..." },
        { "mode": "BUS", "serviceNo": "174", "fromStopCode": "06029", "toStopCode": "05119", "...": "..." },
        { "mode": "WALK", "fromName": "BEF NEIL RD", "toName": "Destination", "...": "..." }
      ]
    }
    // ... up to `numItineraries` alternatives, each independently enriched
  ],
  "recommendation": { "index": 0, "reason": "No live disruptions or lift outages reported on this route right now." }
}
```

Verified live for Mdm Lim's actual Bedok→SGH journey: 3 real ranked
itineraries, correct line resolution, and crowding correctly joined via
shared station codes (confirmed by checking the returned `EW5`-`EW16`
station codes against a live `PCDRealTime` fetch).

## The recommendation logic (`src/services/journeyPlanning/recommend.ts`)

Not a multi-criteria optimiser — a deliberately small piece of logic that
still satisfies "produce a revised route... and say why": prefer the first
of OneMap's own ranked itineraries with no live disruption and no lift
warning on it. If the fastest option already qualifies, say so. If a later
one is cleaner, recommend that one and name what the fastest option's
problem was ("a live service disruption", "a lift under maintenance", or
both). If every option has an issue, fall back to the fastest one and say
that honestly rather than pretending otherwise.

## Accessibility (Mdm Lim) — what this does and does not do

No accessibility/step-free/wheelchair parameter was found in OneMap's public
routing documentation, and none was observed in the live `pt` response
tested. This backend does **not** attempt to force step-free routing out of
OneMap's engine. Instead, matching Mdm Lim's actual trait ("will not
improvise a reroute while travelling — decisions must be presented in
advance with clear trade-offs"), the design is: compute her one usual route,
then let the existing `live` enrichment do its job — if
`FacilitiesMaintenance` reports a lift down at a station on her route, that
surfaces as a `liftWarning` on the affected leg and the whole itinerary is
flagged `hasLiftWarning: true`, which is exactly the "Outram Park Exit A
lift is down" hero-scenario advisory already described in `AGENTS.md`.
Building genuine alternative-exit routing (not just a warning) would need
the `TrainStationExit` GIS layer joined to specific lift locations, which
isn't attempted here — see known limitations.

## Caching

Same `TtlCache` pattern as every other integration
(`JOURNEY_PLAN_CACHE_TTL_MS`, default 60s — journey plans depend on live LTA
data, so kept short like FacilitiesMaintenance rather than long like the
static reference layers). Cache key is the full parameter set
(`start`/`end`/`date`/`time`/etc.), so different queries never collide.
Errors are never cached, matching every other service.

## Known limitations

- Bus legs carry no live enrichment (see "Domain model" above) — no
  real-time load/crowding on the bus portion of a multi-modal route yet.
- No wheelchair/step-free routing parameter — see "Accessibility" above for
  what this backend does instead.
- The recommendation logic only looks at RAIL disruption/lift status, not
  weather (not yet integrated — data.gov.sg's 2hr/24hr/rainfall APIs are
  documented in the challenge brief but not built) or bus-specific
  conditions.
- `numItineraries` defaults to 3; OneMap's own ranking (by generalized cost)
  determines what those 3 are — this backend doesn't request or synthesise
  additional alternatives beyond what OneMap returns.
- Not wired into the frontend yet. `frontend/` is unchanged by this
  milestone — visualising the route/disruption/crowding on the OSM map
  (spec section 3.2.3) is separate work.

## Running and testing

```bash
cd backend
npm test   # includes journey-planning: schema/normalise/enrich/recommend/service, plus OneMapClient auth+error handling
curl "http://localhost:8081/api/journey/plan?from=1.324113,103.930363&to=1.279367,103.834854"
```
