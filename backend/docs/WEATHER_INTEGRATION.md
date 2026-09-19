# Weather Integration (data.gov.sg)

A third, independent third-party integration alongside LTA DataMall
(`LTA_INTEGRATION.md`) and OneMap (`JOURNEY_PLANNING.md`). It answers a
specific line in the hackathon brief's Route Planning requirement: "a
disruption, a crowded platform, **or heavy rain** should change what the app
recommends." This milestone builds the two live weather data sources
themselves; wiring rain conditions into `journeyPlanning`'s recommendation
logic (e.g. annotating a WALK leg as "raining nearby") is a natural next
step, not yet done — see known limitations.

## Why data.gov.sg, and why these two endpoints specifically

The challenge brief's `UsefulWebsites.txt` documents data.gov.sg's real-time
weather APIs as needing **no API key at all** — confirmed live (2026-09-19).
Four endpoints exist (2-hour nowcast, 24-hour forecast, 4-day outlook,
rainfall); this milestone implements the two most relevant to "is it raining
right now, near this journey": the **2-hour nowcast** (short-term forecast
text per named area) and **rainfall** (real-time gauge readings in mm). The
24-hour/4-day outlooks are about planning ahead, not reacting to current
conditions, so they're left unbuilt for now (their OpenAPI specs are
already in the challenge brief at `PS2/references/` if needed later).

## Architecture

```
data.gov.sg real-time weather API (HTTPS, no auth)
      ↓
WeatherClient                 src/weather/client.ts   — no auth needed at all; timeout, error types
      ↓
adapter                       src/services/weather/{twoHourForecast,rainfall}/adapter.ts
      ↓
schema validation             src/services/weather/{twoHourForecast,rainfall}/schema.ts
      ↓
normalisation                 src/services/weather/{twoHourForecast,rainfall}/normalise.ts
      ↓
JourneyAhead domain model      src/models/weather.ts (WeatherForecastArea, RainfallReading)
      ↓
service (cache + status)       src/services/weather/{twoHourForecast,rainfall}/service.ts
      ↓
backend endpoint                GET /api/weather/forecast, GET /api/weather/rainfall
```

Both are standalone "fetch everything, no parameters" endpoints (like
FacilitiesMaintenance or TrainServiceAlerts), not per-location queries — the
2-hour nowcast already covers all 47 named weather areas in one call, and
rainfall covers all ~89 gauge stations in one call, so there's no need to ask
data.gov.sg per-coordinate.

## What was verified live before building anything

- `GET /two-hr-forecast`: `{ data: { area_metadata: [{ name, label_location: { latitude, longitude } }], items: [{ valid_period: { start, end }, forecasts: [{ area, forecast }] }] } }`. One of the 47 named areas is literally **"Bedok"** (`{1.321, 103.924}`) — a direct match for the existing Mdm Lim persona's origin.
- `GET /rainfall`: `{ data: { stations: [{ id, name, location: { latitude, longitude } }], readings: [{ timestamp, data: [{ stationId, value }] }], readingType: "TB1 Rainfall 5 Minute Total F", readingUnit: "mm" } }`.
- Neither needs an `Authorization`/`AccountKey` header — `src/weather/client.ts`'s `get()` sends no auth headers at all, confirmed by a passing test asserting exactly that.

## Domain model (`src/models/weather.ts`)

Deliberately not a `TransportEvent` — this is NEA environmental observation
data, not an LTA-reported occurrence. `WeatherForecastArea.isRaining` is a
plain-text classification (`/rain|shower/i`) against the forecast-text
vocabulary documented in data.gov.sg's own 24-hour-forecast OpenAPI spec
(already in the challenge brief) — checked against every value in that
vocabulary in tests, not an invented judgement call about severity.

## Response shapes

```jsonc
// GET /api/weather/forecast
{
  "status": "LIVE_SUCCESS", "provenance": "LIVE", "fetchedAt": "...", "recordCount": 47,
  "areas": [
    { "area": "Bedok", "forecast": "Cloudy", "isRaining": false, "latitude": 1.321, "longitude": 103.924, "validFrom": "...", "validTo": "..." }
  ]
}

// GET /api/weather/rainfall
{
  "status": "LIVE_SUCCESS", "provenance": "LIVE", "fetchedAt": "...", "recordCount": 89,
  "readings": [
    { "stationId": "S218", "stationName": "Bukit Batok Street 34", "latitude": 1.36491, "longitude": 103.75065, "valueMm": 0, "timestamp": "..." }
  ]
}
```

Live-verified on a normal (non-rainy) day: `forecast` areas mostly
`"Cloudy"`/`isRaining: false`, and every rainfall reading `0`mm — a `0`
reading is a genuine `LIVE_SUCCESS` (it really is 0mm right now), not
treated as `LIVE_EMPTY` (which means no readings were returned at all).

## Caching

`WEATHER_TWO_HOUR_FORECAST_CACHE_TTL_MS` (default 5 min) and
`WEATHER_RAINFALL_CACHE_TTL_MS` (default 5 min, matching rainfall's own
"5 Minute Total" reading type) — short-lived, same `TtlCache` pattern as
every other integration, errors never cached.

## Known limitations

- Not yet wired into `journeyPlanning`'s enrichment/recommendation — a
  WALK leg currently carries no rain annotation, even though the pieces
  (leg geometry, area/station coordinates) are both present. Doing this
  well needs a "nearest weather area/rainfall station to this leg" lookup,
  which wasn't built yet.
- Only the 2-hour nowcast and rainfall are implemented; the 24-hour and
  4-day outlooks are not.
- `isRaining`'s text classification depends on data.gov.sg's forecast
  vocabulary staying stable — if they add a new forecast string this
  pattern doesn't recognise as rain-related, it would (safely) default to
  `false` rather than crash, but that's worth knowing.
- Not wired into the frontend.

## Running and testing

```bash
cd backend
npm test    # includes weather: schema/normalise/service for both endpoints, plus WeatherClient's no-auth/timeout/error handling
curl http://localhost:8081/api/weather/forecast
curl http://localhost:8081/api/weather/rainfall
```
