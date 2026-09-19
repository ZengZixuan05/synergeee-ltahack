import { Router } from 'express';
import { busStopsService } from '../services/busReference/busStops/service';
import { busServicesService } from '../services/busReference/busServices/service';
import { busRoutesService } from '../services/busReference/busRoutes/service';
import { busArrivalService } from '../services/busArrival/service';

export const busRouter = Router();

busRouter.get('/api/bus/stops', async (_req, res) => {
  const result = await busStopsService.getLayer();
  res.status(200).json(result);
});

busRouter.get('/api/bus/services', async (_req, res) => {
  const result = await busServicesService.getLayer();
  res.status(200).json(result);
});

busRouter.get('/api/bus/routes', async (_req, res) => {
  const result = await busRoutesService.getLayer();
  res.status(200).json(result);
});

// Unlike every other route here, this one takes caller-supplied query
// parameters — BusArrival has no "fetch everything" mode, so a bus stop
// code is required. Validated before touching LTA at all.
busRouter.get('/api/bus/arrival', async (req, res) => {
  const busStopCode = typeof req.query.busStopCode === 'string' ? req.query.busStopCode.trim() : '';
  if (!busStopCode) {
    res.status(400).json({ error: 'Query parameter "busStopCode" is required.' });
    return;
  }
  const serviceNo = typeof req.query.serviceNo === 'string' ? req.query.serviceNo.trim() || undefined : undefined;

  const result = await busArrivalService.getBusArrival(busStopCode, serviceNo);
  res.status(200).json(result);
});
