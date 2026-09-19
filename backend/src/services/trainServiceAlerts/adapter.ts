import { LtaDataMallClient } from '../../lta/client';

// TrainServiceAlerts is one of the guide's documented pagination exceptions
// (Table 1, "1. MAKING API CALLS") — a plain `get()`, never `getAllPages()`.
export async function fetchRawTrainServiceAlerts(client: LtaDataMallClient): Promise<unknown> {
  return client.get('/TrainServiceAlerts');
}
