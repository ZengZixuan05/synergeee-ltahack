import { LtaDataMallClient } from '../../lta/client';

/** BusArrival requires a caller-supplied BusStopCode — there is no "fetch everything" mode for this endpoint. */
export async function fetchRawBusArrival(client: LtaDataMallClient, busStopCode: string, serviceNo?: string): Promise<unknown> {
  return client.get('/v3/BusArrival', { params: { BusStopCode: busStopCode, ServiceNo: serviceNo } });
}
