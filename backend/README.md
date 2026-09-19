# Backend

Standalone Express + TypeScript backend for JourneyAheadSG, currently
providing a server-side LTA DataMall integration. It has its own
`package.json`/`node_modules`/`tsconfig.json`, independent of the frontend.

## Structure

- `src/routes/` - API route handlers: `GET /health`, `GET /api/lta/status`, `GET /api/transport/facilities`,
  `GET /api/transport/train-service-alerts`, `GET /api/transport/station-crowding/{real-time,forecast}`,
  `GET /api/geo/{train-stations,train-station-exits,covered-linkways}`,
  `GET /api/bus/{stops,services,routes,arrival}` (arrival requires `?busStopCode=...`)
- `src/middleware/` - Express middleware (generic error handler)
- `src/utils/` - Logging (with secret redaction) and an in-memory TTL cache
- `src/geo/` - SVY21 (Singapore's projected coordinate system) → WGS84 lat/lng conversion, used by the geospatial layers
- `src/models/` - Domain models: canonical rail lines, canonical station shape, `TransportEvent` union, geospatial records, crowding types, bus reference/load types
- `src/services/` - Per-endpoint adapters (LTA schema → normalisation → cached service): `facilitiesMaintenance/`,
  `trainServiceAlerts/`, `pcdRealTime/`, `pcdForecast/`, `busArrival/`,
  `geospatial/{trainStation,trainStationExit,coveredLinkWay}/`, `busReference/{busStops,busServices,busRoutes}/`
- `src/lta/` - Reusable `LtaDataMallClient` (auth header, timeout, pagination, typed HTTP/network errors) and
  `geospatial.ts` (GeospatialWholeIsland's zip/shapefile download+parse, distinct from the OData JSON client)
- `src/config/` - Environment variable access (`LTA_ACCOUNT_KEY`, etc.) — never logs secret values
- `docs/LTA_INTEGRATION.md` - Full write-up of the LTA integration architecture, canonical mappings, and how to verify it

## Getting started

```bash
cd backend
npm install
npm run dev        # tsx watch, starts on :8081 (see .env.example for LTA_ACCOUNT_KEY)
npm test           # vitest
npm run lint        # eslint
npm run typecheck  # tsc --noEmit
npm run build       # tsc -> dist/
```

See [`docs/LTA_INTEGRATION.md`](./docs/LTA_INTEGRATION.md) for the full
architecture, the canonical rail-line mapping (LTA uses inconsistent line
codes across endpoints), the SVY21→WGS84 geospatial conversion, and how to
verify every implemented endpoint end to end.

## Notes

- Environment variables are shared at the root `.env` file (see
  `MONOREPO.md`); `LTA_ACCOUNT_KEY` in production comes from Google Cloud
  Secret Manager instead.
- The frontend Next.js app still handles its own routes (Firebase auth,
  OneMap search) independently — this backend is not yet wired into it.
