import { LtaDataMallClient } from '../../lta/client';

const FACILITIES_MAINTENANCE_PATH = '/v2/FacilitiesMaintenance';

/**
 * Calls LTA DataMall's v2/FacilitiesMaintenance endpoint, following the
 * standard 500-record/$skip pagination via the shared client. Returns the
 * raw, unvalidated records — validation and normalisation happen in
 * schema.ts / normalise.ts.
 */
export async function fetchRawFacilitiesMaintenance(client: LtaDataMallClient): Promise<unknown[]> {
  return client.getAllPages(FACILITIES_MAINTENANCE_PATH);
}
