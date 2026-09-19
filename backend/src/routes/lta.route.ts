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

// Diagnostics for developers verifying the LTA integration. Reads
// last-known state only — it never triggers a fresh LTA call itself, so
// polling this endpoint can't be used to hammer DataMall. Never exposes the
// AccountKey or any other secret; `configured` is a boolean only.
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
    },
  });
});
