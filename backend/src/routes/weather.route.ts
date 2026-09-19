import { Router } from 'express';
import { twoHourForecastService } from '../services/weather/twoHourForecast/service';
import { rainfallService } from '../services/weather/rainfall/service';

export const weatherRouter = Router();

weatherRouter.get('/api/weather/forecast', async (_req, res) => {
  const result = await twoHourForecastService.getTwoHourForecast();
  res.status(200).json(result);
});

weatherRouter.get('/api/weather/rainfall', async (_req, res) => {
  const result = await rainfallService.getRainfall();
  res.status(200).json(result);
});
