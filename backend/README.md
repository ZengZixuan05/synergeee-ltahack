# Backend

Standalone Express + TypeScript backend for JourneyAheadSG: a server-side LTA
DataMall integration plus a OneMap-based multi-modal journey planner. It has
its own `package.json`/`node_modules`/`tsconfig.json`, independent of the
frontend.

## Structure

- `src/routes/` - API route handlers: `GET /health`, `GET /api/lta/status`, `GET /api/transport/facilities`,
  `GET /api/transport/train-service-alerts`, `GET /api/transport/station-crowding/{real-time,forecast}`,
  `GET /api/geo/{train-stations,train-station-exits,covered-linkways}`,
  `GET /api/bus/{stops,services,routes,arrival}` (arrival requires `?busStopCode=...`),
  `GET /api/journey/plan` (requires `?from=lat,lng&to=lat,lng`)
- `src/middleware/` - Express middleware (generic error handler)
- `src/utils/` - Logging (with secret redaction) and an in-memory TTL cache
- `src/geo/` - SVY21→WGS84 conversion (for the LTA geospatial layers) and encoded-polyline decoding (for OneMap route geometry)
- `src/models/` - Domain models: canonical rail lines, canonical station shape, `TransportEvent` union, geospatial records, crowding types, bus reference/load types, journey planning types
- `src/services/` - Per-endpoint adapters (schema → normalisation → cached service): `facilitiesMaintenance/`,
  `trainServiceAlerts/`, `pcdRealTime/`, `pcdForecast/`, `busArrival/`, `journeyPlanning/`,
  `geospatial/{trainStation,trainStationExit,coveredLinkWay}/`, `busReference/{busStops,busServices,busRoutes}/`
- `src/lta/` - Reusable `LtaDataMallClient` (auth header, timeout, pagination, typed HTTP/network errors) and
  `geospatial.ts` (GeospatialWholeIsland's zip/shapefile download+parse, distinct from the OData JSON client)
- `src/onemap/` - `OneMapClient` for the routing service (separate auth/base URL/errors from the LTA client — a second, independent integration)
- `src/config/` - Environment variable access (`LTA_ACCOUNT_KEY`, etc.) — never logs secret values
- `docs/LTA_INTEGRATION.md` - LTA DataMall integration architecture, canonical mappings, and how to verify each endpoint
- `docs/JOURNEY_PLANNING.md` - The OneMap-based route planner: why OneMap, how live LTA data gets layered onto a route, and its limitations

## Getting started

```bash
cd backend
npm install
npm run dev        # tsx watch, starts on :8081 (see .env.example for LTA_ACCOUNT_KEY / ONEMAP_API_KEY)
npm test           # vitest
npm run lint        # eslint
npm run typecheck  # tsc --noEmit
npm run build       # tsc -> dist/
```

See [`docs/LTA_INTEGRATION.md`](./docs/LTA_INTEGRATION.md) for the LTA data
architecture and [`docs/JOURNEY_PLANNING.md`](./docs/JOURNEY_PLANNING.md) for
route planning, including how to verify each end to end.

## Notes

- Environment variables are shared at the root `.env` file (see
  `MONOREPO.md`); `LTA_ACCOUNT_KEY`/OneMap credentials in production come
  from Google Cloud Secret Manager instead.
- The frontend Next.js app still handles its own routes (Firebase auth,
  its own separate OneMap place-search integration) independently — this
  backend is not yet wired into it.
