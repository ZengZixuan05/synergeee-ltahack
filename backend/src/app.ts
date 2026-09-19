import express, { Express } from 'express';
import { healthRouter } from './routes/health.route';
import { ltaRouter } from './routes/lta.route';
import { facilitiesRouter } from './routes/facilities.route';
import { geospatialRouter } from './routes/geospatial.route';
import { trainServiceAlertsRouter } from './routes/trainServiceAlerts.route';
import { stationCrowdingRouter } from './routes/stationCrowding.route';
import { busRouter } from './routes/bus.route';
import { errorHandler } from './middleware/errorHandler';

/** Builds the Express app without starting a listener, so tests can exercise it directly (e.g. via supertest). */
export function createApp(): Express {
  const app = express();

  app.use(healthRouter);
  app.use(ltaRouter);
  app.use(facilitiesRouter);
  app.use(geospatialRouter);
  app.use(trainServiceAlertsRouter);
  app.use(stationCrowdingRouter);
  app.use(busRouter);

  app.use(errorHandler);

  return app;
}
