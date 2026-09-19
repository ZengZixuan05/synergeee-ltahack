import { Router } from 'express';
import { trainStationService } from '../services/geospatial/trainStation/service';
import { trainStationExitService } from '../services/geospatial/trainStationExit/service';
import { coveredLinkWayService } from '../services/geospatial/coveredLinkWay/service';

// Static geospatial reference layers, namespaced separately from
// /api/transport (live occurrences) since these are reference geometry, not
// events. Note: /api/geo/covered-linkways can return several MB of JSON —
// 7000+ polygon features observed live — see known limitations in
// backend/docs/LTA_INTEGRATION.md.
export const geospatialRouter = Router();

geospatialRouter.get('/api/geo/train-stations', async (_req, res) => {
  const result = await trainStationService.getLayer();
  res.status(200).json(result);
});

geospatialRouter.get('/api/geo/train-station-exits', async (_req, res) => {
  const result = await trainStationExitService.getLayer();
  res.status(200).json(result);
});

geospatialRouter.get('/api/geo/covered-linkways', async (_req, res) => {
  const result = await coveredLinkWayService.getLayer();
  res.status(200).json(result);
});
