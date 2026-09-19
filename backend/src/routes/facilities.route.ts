import { Router } from 'express';
import { facilitiesMaintenanceService } from '../services/facilitiesMaintenance/service';

// Public JourneyAhead shape only — never the raw LTA envelope. LIVE_ERROR is
// reported as a normal 200-with-status-field response (not an HTTP 5xx) so
// the frontend can distinguish "LTA had nothing to report" from "we
// couldn't reach LTA" without special-casing HTTP status codes; the
// `status` field is the source of truth for that distinction.
export const facilitiesRouter = Router();

facilitiesRouter.get('/api/transport/facilities', async (_req, res) => {
  const result = await facilitiesMaintenanceService.getFacilitiesMaintenance();
  res.status(200).json(result);
});
