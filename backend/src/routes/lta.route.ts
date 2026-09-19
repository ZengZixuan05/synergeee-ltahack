import { Router } from 'express';
import { facilitiesMaintenanceService } from '../services/facilitiesMaintenance/service';
import { trainStationService } from '../services/geospatial/trainStation/service';
import { trainStationExitService } from '../services/geospatial/trainStationExit/service';
import { coveredLinkWayService } from '../services/geospatial/coveredLinkWay/service';
import { trainServiceAlertsService } from '../services/trainServiceAlerts/service';
import { pcdRealTimeService } from '../services/pcdRealTime/service';
import { pcdForecastService } from '../services/pcdForecast/service';
import { busStopsService } from '../services/busReference/busStops/service';
import { busServicesService } from '../services/busReference/busServices/service';
import { busRoutesService } from '../services/busReference/busRoutes/service';
import { busArrivalService } from '../services/busArrival/service';
import { journeyPlanningService } from '../services/journeyPlanning/service';
import { twoHourForecastService } from '../services/weather/twoHourForecast/service';
import { rainfallService } from '../services/weather/rainfall/service';

// Diagnostics for developers verifying every backend data integration —
// LTA DataMall, OneMap, and data.gov.sg weather alike. The path has kept its
// original "/api/lta/status" name from when LTA was the only integration;
// it's grown into the one general backend diagnostics endpoint rather than
// fragmenting status checks across three paths. Reads last-known state
// only — it never triggers a fresh upstream request itself, so polling this
// endpoint can't be used to hammer any of them. Never exposes an AccountKey,
// API key, or any other secret; `configured` (where applicable) is a
// boolean only.
export const ltaRouter = Router();

ltaRouter.get('/api/lta/status', (_req, res) => {
  res.status(200).json({
    endpoints: {
      facilitiesMaintenance: facilitiesMaintenanceService.getDiagnosticsSnapshot(),
      trainStation: trainStationService.getDiagnosticsSnapshot(),
      trainStationExit: trainStationExitService.getDiagnosticsSnapshot(),
      coveredLinkWay: coveredLinkWayService.getDiagnosticsSnapshot(),
      trainServiceAlerts: trainServiceAlertsService.getDiagnosticsSnapshot(),
      pcdRealTime: pcdRealTimeService.getDiagnosticsSnapshot(),
      pcdForecast: pcdForecastService.getDiagnosticsSnapshot(),
      busStops: busStopsService.getDiagnosticsSnapshot(),
      busServices: busServicesService.getDiagnosticsSnapshot(),
      busRoutes: busRoutesService.getDiagnosticsSnapshot(),
      busArrival: busArrivalService.getDiagnosticsSnapshot(),
      journeyPlanning: journeyPlanningService.getDiagnosticsSnapshot(),
      weatherTwoHourForecast: twoHourForecastService.getDiagnosticsSnapshot(),
      weatherRainfall: rainfallService.getDiagnosticsSnapshot(),
    },
  });
});
