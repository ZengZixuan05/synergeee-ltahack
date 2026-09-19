import { Router } from 'express';
import { pcdRealTimeService } from '../services/pcdRealTime/service';
import { pcdForecastService } from '../services/pcdForecast/service';

// Kept as two separate endpoints, not one "crowding" endpoint with a mode
// switch — see the crowding-distinction note in models/transportEvent.ts.
export const stationCrowdingRouter = Router();

stationCrowdingRouter.get('/api/transport/station-crowding/real-time', async (_req, res) => {
  const result = await pcdRealTimeService.getStationCrowding();
  res.status(200).json(result);
});

stationCrowdingRouter.get('/api/transport/station-crowding/forecast', async (_req, res) => {
  const result = await pcdForecastService.getStationCrowdingForecast();
  res.status(200).json(result);
});
