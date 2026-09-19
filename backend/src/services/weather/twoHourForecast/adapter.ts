import { WeatherClient } from '../../../weather/client';

export async function fetchRawTwoHourForecast(client: WeatherClient): Promise<unknown> {
  return client.get('two-hr-forecast');
}
