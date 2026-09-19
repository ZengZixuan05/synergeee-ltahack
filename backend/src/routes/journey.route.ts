import { Router } from 'express';
import { journeyPlanningService } from '../services/journeyPlanning/service';

export const journeyRouter = Router();

const LAT_LNG_PATTERN = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

function formatDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * GET /api/journey/plan?from=lat,lng&to=lat,lng[&date=MM-DD-YYYY&time=HH:mm:ss&maxWalkDistance=&numItineraries=]
 * date/time default to now if omitted (a "plan my journey right now" request).
 */
journeyRouter.get('/api/journey/plan', async (req, res) => {
  const from = queryString(req.query.from);
  const to = queryString(req.query.to);

  if (!from || !LAT_LNG_PATTERN.test(from)) {
    res.status(400).json({ error: 'Query parameter "from" is required and must be "lat,lng".' });
    return;
  }
  if (!to || !LAT_LNG_PATTERN.test(to)) {
    res.status(400).json({ error: 'Query parameter "to" is required and must be "lat,lng".' });
    return;
  }

  const now = new Date();
  const date = queryString(req.query.date) ?? formatDate(now);
  const time = queryString(req.query.time) ?? formatTime(now);
  const maxWalkDistanceRaw = queryString(req.query.maxWalkDistance);
  const numItinerariesRaw = queryString(req.query.numItineraries);

  const result = await journeyPlanningService.planJourney({
    start: from,
    end: to,
    date,
    time,
    maxWalkDistance: maxWalkDistanceRaw ? Number(maxWalkDistanceRaw) : undefined,
    numItineraries: numItinerariesRaw ? Number(numItinerariesRaw) : 3,
  });

  res.status(200).json(result);
});
