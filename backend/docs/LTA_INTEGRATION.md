# LTA DataMall Integration

Backend-only integration with [LTA DataMall](https://datamall.lta.gov.sg/) for
JourneyAheadSG. This document covers what's implemented, how the pieces fit
together, and how to run/verify it. It does not cover the frontend — nothing
here is consumed by the Next.js app yet (see "Live vs demo" below for why).

## Architecture

```
LTA DataMall (HTTPS)
      ↓
LtaDataMallClient        src/lta/client.ts       — auth header, timeout, pagination, HTTP/network error types
      ↓                  src/lta/geospatial.ts   — GeospatialWholeIsland-only: link → zip download → shapefile parse
      ↓
endpoint adapter         src/services/<endpoint>/adapter.ts   — calls the client for one endpoint
      ↓
schema validation        src/services/<endpoint>/schema.ts    — zod schema for the raw LTA record shape
      ↓
normalisation             src/services/<endpoint>/normalise.ts — raw record → domain model
      ↓
JourneyAhead domain model src/models/transportEvent.ts, railLine.ts, station.ts, geospatial.ts, stationCrowdingForecast.ts, crowdLevel.ts
      ↓
service (cache + status)  src/services/<endpoint>/service.ts  (geospatial layers share src/services/geospatial/layerService.ts)
      ↓
backend endpoint          src/routes/*.route.ts
      ↓
frontend (later — not wired up in this milestone)
```

The backend is a standalone Express + TypeScript service in `backend/`,
independent of the Next.js frontend in `frontend/`. It does not share a
`package.json`, `tsconfig.json`, or `node_modules` with the frontend — see
`MONOREPO.md`. The only thing genuinely shared is the root `.env` file.

## Environment variable

```
LTA_ACCOUNT_KEY=<your LTA DataMall AccountKey>
```

- Local development: add it to the repo-root `.env` (already gitignored;
  see `.env.example` for the placeholder). `backend/src/index.ts` loads the
  root `.env` on startup via `dotenv`, without ever logging its value.
- Production: provided as a real environment variable via **Google Cloud
  Secret Manager** — the LTA_ACCOUNT_KEY secret is already provisioned there
  for this project. `src/config/env.ts` reads it from `process.env` either
  way; the backend code has no idea whether the value came from a `.env`
  file or Secret Manager.
- The key is never logged, returned from any endpoint, or embedded in a
  `NEXT_PUBLIC_*` variable. `src/utils/logger.ts`'s `redactHeaders()` masks
  the `AccountKey` header (and `Authorization`) before any request is
  logged; only status/duration/path are logged for outgoing LTA calls.

Optional variables (all have safe defaults — see `src/config/env.ts` and each
service's `service.ts`):

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_PORT` / `PORT` | `8081` | Port the Express server listens on |
| `LTA_DATAMALL_BASE_URL` | `https://datamall2.mytransport.sg/ltaodataservice` | Override for testing against a different host |
| `FACILITIES_MAINTENANCE_CACHE_TTL_MS` | `60000` (1 min) | FacilitiesMaintenance cache |
| `TRAIN_SERVICE_ALERTS_CACHE_TTL_MS` | `30000` (30 sec) | TrainServiceAlerts cache — short, since an active disruption is time-sensitive |
| `PCD_REALTIME_CACHE_TTL_MS` | `300000` (5 min) | PCDRealTime cache — guide says it updates every 10 min |
| `PCD_FORECAST_CACHE_TTL_MS` | `43200000` (12 hr) | PCDForecast cache — guide says it updates every 24 hr |
| `TRAIN_STATION_CACHE_TTL_MS` | `86400000` (24 hr) | TrainStation GIS layer cache |
| `TRAIN_STATION_EXIT_CACHE_TTL_MS` | `86400000` (24 hr) | TrainStationExit GIS layer cache |
| `COVERED_LINKWAY_CACHE_TTL_MS` | `86400000` (24 hr) | CoveredLinkWay GIS layer cache |

## What's implemented

| Endpoint | Backend route | Notes |
|---|---|---|
| `v2/FacilitiesMaintenance` | `GET /api/transport/facilities` | Phase 1 — lift maintenance (Mdm Lim scenario) |
| `GeospatialWholeIsland?ID=TrainStation` | `GET /api/geo/train-stations` | Phase 1 — station footprints (polygons) |
| `GeospatialWholeIsland?ID=TrainStationExit` | `GET /api/geo/train-station-exits` | Phase 1 — exit points |
| `GeospatialWholeIsland?ID=CoveredLinkWay` | `GET /api/geo/covered-linkways` | Phase 1 — sheltered walkway polygons |
| `TrainServiceAlerts` | `GET /api/transport/train-service-alerts` | Phase 2 — network disruption status |
| `PCDRealTime` | `GET /api/transport/station-crowding/real-time` | Phase 2 — real-time station crowding, all lines |
| `PCDForecast` | `GET /api/transport/station-crowding/forecast` | Phase 2 — forecast station crowding, all lines |

Plus `GET /api/lta/status` (diagnostics for all seven above) and `GET
/health` (plain liveness, no LTA dependency).

### Response shape of `GET /api/transport/facilities`

```jsonc
{
  "status": "LIVE_SUCCESS",       // "LIVE_SUCCESS" | "LIVE_EMPTY" | "LIVE_ERROR"
  "provenance": "LIVE",           // always "LIVE" from this endpoint — see "Live vs demo"
  "fetchedAt": "2026-09-19T01:51:42.692Z",
  "recordCount": 4,
  "skippedRecordCount": 0,        // raw records that failed schema validation and were skipped
  "events": [
    {
      "id": "lift-maintenance:NE12:b1l01",
      "type": "LIFT_MAINTENANCE",
      "source": "LTA",
      "provenance": "LIVE",
      "station": { "stationCode": "NE12", "stationName": "Serangoon", "line": "NEL", "rawLine": "NEL" },
      "lastUpdated": "2026-09-19T01:51:42.692Z",
      "liftId": "B1L01",
      "liftDescription": "Exit B Street level - Concourse"
    }
  ]
}
```

`errorMessage` is present only when `status` is `LIVE_ERROR`, and is always a
generic, secret-free message (never a raw caught exception). Every other
endpoint below follows the same `status`/`provenance`/`fetchedAt` envelope
shape, with `events` or `records` holding the type-specific payload.

### Response shape of `GET /api/transport/train-service-alerts`

```jsonc
{
  "status": "LIVE_EMPTY",   // LIVE_EMPTY is the common case: no active disruption right now
  "provenance": "LIVE",
  "fetchedAt": "2026-09-19T02:11:48.540Z",
  "recordCount": 0,
  "events": [],             // one TRAIN_SERVICE_ALERT per currently-affected line segment
  "messages": [             // general advisories (e.g. planned works) — NOT tied to a specific line/station
    { "content": "05:00-BP-Planned Service Adjustments...", "createdDate": "2026-09-18 20:06:30" }
  ]
}
```

Live-confirmed (2026-09-19) response envelope: `value` is a single OBJECT
(`{ Status, AffectedSegments, Message }`), not an array — this also settles
an inconsistency in the guide's own Annex C screenshots, where the
"disruption" sample shows `"value": {...}` but the "normal scenario" sample
shows `"value": [` with content that isn't valid JSON as printed. The live
response confirms the object form.

### Response shapes of the two crowding endpoints

`GET /api/transport/station-crowding/real-time` → `events: StationCrowdingObservedEvent[]`,
one per (station, interval) actually observed just now.

`GET /api/transport/station-crowding/forecast` → `records: StationCrowdingForecast[]`,
one per (station, date), each holding that day's full list of 30-minute
`intervals` — deliberately NOT flattened into one record per interval (see
"Domain model" below).

Both PCDRealTime and PCDForecast require `TrainLine` as a mandatory request
parameter and only return that line's stations, so getting network-wide
coverage means one call per known line code
(`PCD_TRAIN_LINE_CODES` in `railLine.ts`: `CCL, CEL, CGL, DTL, EWL, NEL, NSL,
BPL, SLRT, PLRT, TEL`) — 11 calls per fetch, **run sequentially, not in
parallel**. This was not a design choice up front: firing all 11
concurrently via `Promise.all` reliably triggered a transient HTTP 500 from
LTA on at least one request, confirmed live (2026-09-19); the same 11 calls
made one after another all succeeded every time. Nothing in the guide
mentions this — it was only discoverable by hitting the live API. See
`src/services/pcdRealTime/adapter.ts`.

## Canonical rail-line mapping (`src/models/railLine.ts`)

The LTA DataMall guide documents **different line-code vocabularies for
different endpoints**, and this integration confirmed a **third, undocumented
one** during live verification:

| Concept | TrainServiceAlerts | Station Crowd Density (PCD) | v2/FacilitiesMaintenance (live-observed) |
|---|---|---|---|
| Sengkang LRT | `STL` | `SLRT` | — |
| Punggol LRT | `PTL` | `PLRT` | — |
| Circle Line Extension | folded into `CCL` | `CEL` | — |
| Changi Extension | folded into `EWL` | `CGL` | — |
| Bukit Panjang LRT | `BPL` | `BPL` | `BPLRT` (seen live 2026-09-19, not in the guide at all) |

`resolveCanonicalLine(rawCode, source)` translates any of these into one of
JourneyAhead's own stable `CanonicalRailLine` codes (`NSL`, `EWL`, `CGL`,
`NEL`, `CCL`, `CEL`, `DTL`, `TEL`, `BPL`, `SKL`, `PGL`). If a raw code isn't
in the known table for that source, it resolves to `canonical: null` with
the raw code preserved — **never guessed**. This already mattered in
practice twice: FacilitiesMaintenance's `Line` field isn't documented
against either vocabulary (its resolver table is the union of both, plus the
observed `BPLRT` mapping), and every `TrainServiceAlertEvent`/
`StationCrowdingObservedEvent`/`StationCrowdingForecast` resolves its line
from the vocabulary appropriate to the endpoint that reported it.

One inherent limitation this module does **not** try to paper over: when
TrainServiceAlerts reports `"EWL"`, it might mean the East West Line proper
or the folded-in Changi Extension — the source doesn't say which, so neither
does JourneyAhead. Resolving that would need a station-to-extension lookup,
which isn't feasible with the GIS data available today either — see
"Geospatial layers" below for why.

## Canonical station foundation (`src/models/station.ts`)

`CanonicalStationRef` is a small, stable shape (`stationCode`, `stationName`,
resolved `line`, `rawLine`) used by `LiftMaintenanceEvent`, so records from
different endpoints can eventually be joined on `stationCode`. It is a type
contract, not a bundled dataset.

**This did not end up extending to the GIS layers, and that's a genuine
finding, not an oversight**: TrainStation/TrainStationExit geospatial
records carry no LTA station code at all (see "Geospatial layers" below), so
`CanonicalStationRef` can't be populated from them without inventing a
name-matching heuristic the source data doesn't support. `TrainServiceAlertEvent`
and `StationCrowdingObservedEvent`/`StationCrowdingForecast` also don't use
`CanonicalStationRef` — they only have a bare `stationCode` string, because
those endpoints don't report a station name either.

## Geospatial layers (`src/lta/geospatial.ts`, `src/models/geospatial.ts`)

`GeospatialWholeIsland` (guide section 2.22) is structurally unlike every
OData JSON endpoint: it returns `{ value: [{ Link }] }`, where `Link` is a
presigned S3 URL (confirmed live: expires in 300s) to a ZIP of an ESRI
shapefile. `src/lta/geospatial.ts` downloads that ZIP (`adm-zip`), extracts
the `.shp`/`.dbf` pair, and parses them (`shapefile` npm package) into
GeoJSON features — still in **SVY21** projected coordinates at that point.

**SVY21, not WGS84 lat/lng.** Every shapefile layer's geometry is in
Singapore's local projected coordinate system (EPSG:3414), confirmed live —
a real TrainStation vertex was `[36786.93, 41775.31]`, nowhere near a
Singapore lat/lng. Nothing in the guide mentions this. `src/geo/svy21.ts`
converts every coordinate to WGS84 using the Singapore Land Authority's
public SVY21 projection definition (not invented for this project — see
https://epsg.io/3414), rounded to ~1cm precision. This was validated two
ways: (1) the projection's own defining origin point round-trips correctly,
and (2) a real TrainStationExit record for "MACPHERSON MRT STATION" / "Exit
A" converts to `[103.8897933, 1.3266788]` — the real, known location of
Macpherson MRT station.

**No station code in any of these three layers** — another finding, not a
design choice:

- `TrainStation`: Polygon footprints. Properties are `TYP_CD_DES` (`"MRT"`/`"LRT"`),
  `STN_NAM_DE` (e.g. `"HOUGANG MRT STATION"`), and an inconsistently-present
  `ATTACHEMEN` filename that sometimes embeds a code (e.g.
  `"NE14_HGN STN.zip"`) but is a filename, not a documented station-code
  field, and is often `null`.
- `TrainStationExit`: Point geometries. Properties are `stn_name` and
  `exit_code` — note the different casing/naming convention from
  TrainStation's `STN_NAM_DE`, a real cross-layer inconsistency, not a typo.
- `CoveredLinkWay`: Polygon geometries. The **only** property is `OBJECTID` —
  no name, description, or shelter-type attribute at all.

Because none of these carry a `StationCode` value like FacilitiesMaintenance
or TrainServiceAlerts do, joining them by name (e.g. matching `"HOUGANG MRT
STATION"` to `StationCode: "NE14"`) would require a fuzzy-matching heuristic
this milestone deliberately does not build — see AGENTS.md's instruction not
to invent joins the data doesn't support.

**Response size**: `GET /api/geo/covered-linkways` returned **3.4MB** of
JSON for 7012 polygon features in live testing. `GET /api/geo/train-stations`
(231 features) and `GET /api/geo/train-station-exits` (613 features) are much
smaller (under 600KB). No pagination or bounding-box filtering is
implemented for these yet — see known limitations.

## Domain model (`src/models/transportEvent.ts`)

`TransportEvent` is a discriminated union with three members so far:
`LiftMaintenanceEvent` (`LIFT_MAINTENANCE`), `TrainServiceAlertEvent`
(`TRAIN_SERVICE_ALERT`), and `StationCrowdingObservedEvent`
(`STATION_CROWDING_OBSERVED`).

`station: CanonicalStationRef` lives on `LiftMaintenanceEvent` specifically,
not on a shared base — `TrainServiceAlertEvent` affects a **list** of
station codes (`Stations: "NE9,NE8,NE7,NE6"` in one real response), which
doesn't fit a singular `CanonicalStationRef` without either dropping
stations or fabricating a "primary" one the source doesn't designate. This
is a deliberate refactor made once the second endpoint's real shape was
known, not the original design.

`LIFT_MAINTENANCE`, not `LIFT_OUTAGE` — LTA's own framing is "ad hoc lift
maintenance", which doesn't distinguish scheduled maintenance from an
unplanned failure. Functionally it still means the lift is unavailable;
`liftDescription` preserves LTA's own text as source data, without inferring
an exact station-exit relationship from it.

`TrainServiceAlertEvent` is created **one per currently-affected line
segment** (`AffectedSegments` array entry), so a disruption-free response
produces zero events — this is the common case (`LIVE_EMPTY`). LTA's general
advisory `Message` entries (e.g. planned-works notices) are a separate,
line-independent concept, surfaced as `messages` alongside `events` rather
than modelled as `TransportEvent`s. `FreePublicBus`/`FreeMRTShuttle` are kept
as raw strings, not parsed into station-code arrays — the guide documents
these can also hold the literal string `"Free bus service island wide"`,
which isn't a station code.

**Crowding**: PCDRealTime, PCDForecast, and BusArrival's per-bus `Load`
(not implemented) are three distinct concepts, never merged into one
generic "crowding" field. `StationCrowdingObservedEvent` (PCDRealTime) fits
the `TransportEvent` shape naturally — one real occurrence per
(station, interval). PCDForecast is **not** a `TransportEvent` member:
flattening its per-day/per-station/per-30-minute-interval structure into one
event per interval would produce tens of thousands of records per fetch
across all 11 lines. It's modelled instead as `StationCrowdingForecast`
(`src/models/stationCrowdingForecast.ts`) — one record per (station, date)
holding the full interval list.

## Live vs demo

This backend only ever produces `LIVE_SUCCESS`, `LIVE_EMPTY`, or
`LIVE_ERROR` — all with `provenance: "LIVE"` — across every endpoint above.
There is **no automatic fallback to demo data** anywhere in this
integration: if LTA is unreachable or errors, the affected endpoint reports
`LIVE_ERROR` with a safe message, not a silently-substituted demo fixture.
The frontend's existing demo fixtures (`frontend/src/fixtures/*`) are
untouched and unrelated to this backend; wiring the two together, including
any demo-scenario UI, is explicitly out of scope for this milestone.

`TransportEventProvenance` is typed as `'LIVE' | 'DEMO'` specifically so a
future demo-data source can construct the same `TransportEvent` shape with
`provenance: 'DEMO'` — but this backend never produces that value itself.

## Caching

`src/utils/ttlCache.ts` is a minimal in-memory TTL cache (no Redis or other
infrastructure), used by every service above with its own TTL tuned to that
endpoint's real-world update frequency (see the env var table). Errors are
deliberately **never cached**, so the next request retries against LTA
rather than repeating a stale failure. The geospatial layer services
(TrainStation/TrainStationExit/CoveredLinkWay) share one generic
`GeospatialLayerService<T>` (`src/services/geospatial/layerService.ts`) for
this cache/status/error orchestration, since all three are structurally
identical apart from the layer id and the properties→domain normalisation.
This cache is per-process and does not survive a restart or span multiple
instances — acceptable for a single Cloud Run instance in this milestone.

## Diagnostics (`GET /api/lta/status`)

```json
{
  "endpoints": {
    "facilitiesMaintenance": { "configured": true, "lastRequestAt": "...", "lastStatus": "LIVE_SUCCESS", "lastRecordCount": 4 },
    "trainStation": { "...": "..." },
    "trainStationExit": { "...": "..." },
    "coveredLinkWay": { "...": "..." },
    "trainServiceAlerts": { "...": "..." },
    "pcdRealTime": { "...": "..." },
    "pcdForecast": { "...": "..." }
  }
}
```

This reads last-known state only — it never triggers a new LTA request
itself, so polling it repeatedly can't be used to hammer DataMall. `GET
/health` is a separate, dependency-free liveness check for load
balancers/Cloud Run, and requires no authentication (there is no Firebase
auth on any backend route in this milestone — these are read-only,
non-user-scoped diagnostics/data endpoints).

## Running and testing

```bash
cd backend
npm install
npm run dev          # tsx watch — starts on :8081 (or $BACKEND_PORT)
npm test             # vitest — 96 tests, all mocked (no live network)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # tsc -> dist/
```

Verify manually against the real LTA API once `LTA_ACCOUNT_KEY` is set:

```bash
curl http://localhost:8081/health
curl http://localhost:8081/api/lta/status
curl http://localhost:8081/api/transport/facilities
curl http://localhost:8081/api/transport/train-service-alerts
curl http://localhost:8081/api/transport/station-crowding/real-time
curl http://localhost:8081/api/transport/station-crowding/forecast
curl http://localhost:8081/api/geo/train-stations
curl http://localhost:8081/api/geo/train-station-exits
curl http://localhost:8081/api/geo/covered-linkways   # ~3.4MB — see "Geospatial layers"
```

### Live connectivity status (last verified 2026-09-19)

All seven endpoints above were verified against the real LTA DataMall API
using the AccountKey already configured for this project (also provisioned
in Google Cloud Secret Manager for production). Observed results:

| Endpoint | Result |
|---|---|
| `v2/FacilitiesMaintenance` | `LIVE_SUCCESS`, 4 records (DTL, NEL ×2, BPLRT) |
| `TrainServiceAlerts` | `LIVE_EMPTY`, 0 disruptions, 2-3 general advisories |
| `PCDRealTime` | `LIVE_SUCCESS`, 226 station observations across 11 lines |
| `PCDForecast` | `LIVE_SUCCESS`, 226 station/date forecast records |
| `GeospatialWholeIsland?ID=TrainStation` | `LIVE_SUCCESS`, 231 station footprints |
| `GeospatialWholeIsland?ID=TrainStationExit` | `LIVE_SUCCESS`, 613 exit points |
| `GeospatialWholeIsland?ID=CoveredLinkWay` | `LIVE_SUCCESS`, 7012 polygon segments |

No records were fabricated or taken from a fixture; these were genuine
`LIVE_SUCCESS`/`LIVE_EMPTY` responses. Three implementation bugs were found
and fixed only because of this live testing (none were catchable by mocked
unit tests alone, since the mocks would have encoded the same wrong
assumption): the LTA base URL was being silently truncated by
`new URL(path, base)` dropping `/ltaodataservice` for any path with a
leading slash; `LiftID: ""` was sent instead of omitted; and firing all 11
PCDRealTime/PCDForecast line requests concurrently reliably triggered a
transient LTA-side 500.

## Known limitations

- Phase 3 (BusArrival/BusStops/BusServices/BusRoutes) and later phases
  (PubFloodAlerts, TrafficIncidents, RoadWorks, RoadOpenings,
  PlannedBusRoutes) are intentionally not built yet.
- The EWL/Changi-Extension and CCL/Circle-Line-Extension ambiguity (see
  "Canonical rail-line mapping") is a genuine LTA data limitation. Resolving
  it would need a station-to-extension lookup, but the GIS layers
  implemented this milestone don't provide one either — see "Geospatial
  layers" for why (no station code in that data at all).
- FacilitiesMaintenance records carry no start/end timestamp in the LTA
  response, so those events' `startTime`/`endTime` are always omitted —
  only `lastUpdated` (when JourneyAhead fetched it) is set.
- TrainServiceAlerts/PCDRealTime/PCDForecast all use "all-or-nothing" error
  handling: a malformed `AffectedSegments` entry, or a single failed
  per-line PCD request, fails the whole response (`LIVE_ERROR`) rather than
  reporting partial success. Reasonable for now given how small these
  response arrays are (0-2 segments; 11 lines), but worth revisiting if
  per-line reliability becomes uneven in practice.
- `GET /api/geo/covered-linkways` returns ~3.4MB of JSON with no pagination
  or bounding-box filtering — fine for a single fetch/cache cycle today, but
  would need addressing before any client fetches it repeatedly or on a slow
  connection.
- No station code is available from TrainStation/TrainStationExit, so
  `CanonicalStationRef` still isn't populated from GIS data — see
  "Geospatial layers".
- The in-memory cache is per-process; a multi-instance deployment would see
  each instance re-fetch independently until this is revisited.
- No automated test exercises the real `adm-zip`/`shapefile` binary parsing
  path directly (fabricating valid shapefile bytes for a fixture wasn't
  judged worth the effort given both are established third-party libraries)
  — that path is instead exercised via the live verification above. Tests
  inject a fake `parseShapefileFeaturesImpl` at that boundary. Worth adding
  a real fixture if this code needs to change without live-testing access.
- Not wired into the frontend. `frontend/` is unchanged by this milestone.

## Recommended next milestone

Phase 3 (bus data: `v3/BusArrival`, `BusStops`, `BusServices`, `BusRoutes`)
per AGENTS.md's roadmap. `BusArrival`'s per-bus `Load` field should get its
own `TransportEvent` member (e.g. `BusLoadObservedEvent`) — it's a third,
distinct crowding concept from the two already implemented, not a
continuation of `StationCrowdingObservedEvent`. Separately, if resolving the
EWL/CGL and CCL/CEL line-extension ambiguity becomes a priority, revisit
whether a different LTA dataset (outside what GeospatialWholeIsland offers)
actually carries a station-code-to-extension mapping before building
anything — this milestone's investigation found none in the layers tried.
