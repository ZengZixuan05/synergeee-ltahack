import { Router } from 'express';
import { trainServiceAlertsService } from '../services/trainServiceAlerts/service';

export const trainServiceAlertsRouter = Router();

trainServiceAlertsRouter.get('/api/transport/train-service-alerts', async (_req, res) => {
  const result = await trainServiceAlertsService.getTrainServiceAlerts();
  res.status(200).json(result);
});
