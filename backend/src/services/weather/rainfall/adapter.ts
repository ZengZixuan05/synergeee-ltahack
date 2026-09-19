import { WeatherClient } from '../../../weather/client';

export async function fetchRawRainfall(client: WeatherClient): Promise<unknown> {
  return client.get('rainfall');
}
