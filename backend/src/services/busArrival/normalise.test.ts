import { describe, expect, it } from 'vitest';
import { normaliseBusArrival } from './normalise';
import { LtaResponseShapeError } from '../../lta/errors';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';
const BUS_STOP_CODE = '83139';

// Mirrors a real live v3/BusArrival response (2026-09-19).
const LIVE_RESPONSE = {
  BusStopCode: BUS_STOP_CODE,
  Services: [
    {
      ServiceNo: '15',
      Operator: 'GAS',
      NextBus: {
        OriginCode: '77009',
        DestinationCode: '77009',
        EstimatedArrival: '2026-09-19T10:56:54+08:00',
        Monitored: 1,
        Latitude: '1.3353798333333333',
        Longitude: '103.9102195',
        VisitNumber: '1',
        Load: 'SEA',
        Feature: 'WAB',
        Type: 'SD',
      },
      NextBus2: {
        OriginCode: '77009',
        DestinationCode: '77009',
        EstimatedArrival: '2026-09-19T11:15:44+08:00',
        Monitored: 1,
        Latitude: '1.31',
        Longitude: '103.9',
        VisitNumber: '1',
        Load: 'SDA',
        Feature: '',
        Type: 'SD',
      },
      // NextBus3 omitted entirely, mirroring "only two buses left on the road".
    },
  ],
};

describe('normaliseBusArrival', () => {
  it('normalises one BusLoadObservedEvent per real upcoming bus', () => {
    const { events } = normaliseBusArrival(LIVE_RESPONSE, BUS_STOP_CODE, FETCHED_AT);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: 'BUS_LOAD_OBSERVED',
      source: 'LTA',
      provenance: 'LIVE',
      busStopCode: BUS_STOP_CODE,
      serviceNo: '15',
      operator: 'GAS',
      estimatedArrival: '2026-09-19T10:56:54+08:00',
      latitude: 1.3353798333333333,
      longitude: 103.9102195,
      monitored: true,
      load: 'SEATS_AVAILABLE',
      rawLoad: 'SEA',
      wheelchairAccessible: true,
      vehicleType: 'SD',
    });
  });

  it('treats a blank Feature ("") as wheelchairAccessible: false, distinct from an absent Feature', () => {
    const { events } = normaliseBusArrival(LIVE_RESPONSE, BUS_STOP_CODE, FETCHED_AT);
    expect(events[1]!.wheelchairAccessible).toBe(false);
  });

  it('treats a blank NextBus2/NextBus3 slot (no EstimatedArrival) as "no bus", not an event', () => {
    const response = {
      Services: [{ ServiceNo: '5', Operator: 'SBST', NextBus: LIVE_RESPONSE.Services[0]!.NextBus, NextBus2: {}, NextBus3: undefined }],
    };
    const { events } = normaliseBusArrival(response, BUS_STOP_CODE, FETCHED_AT);
    expect(events).toHaveLength(1);
  });

  it('treats an unrecognised Load code as UNKNOWN rather than guessing', () => {
    const response = { Services: [{ ServiceNo: '5', Operator: 'SBST', NextBus: { ...LIVE_RESPONSE.Services[0]!.NextBus, Load: 'XYZ' } }] };
    const { events } = normaliseBusArrival(response, BUS_STOP_CODE, FETCHED_AT);
    expect(events[0]!.load).toBe('UNKNOWN');
    expect(events[0]!.rawLoad).toBe('XYZ');
  });

  it('handles an empty Services array (no buses currently in service) without error', () => {
    const { events } = normaliseBusArrival({ Services: [] }, BUS_STOP_CODE, FETCHED_AT);
    expect(events).toEqual([]);
  });

  it('throws LtaResponseShapeError for a completely malformed response', () => {
    expect(() => normaliseBusArrival(null, BUS_STOP_CODE, FETCHED_AT)).toThrow(LtaResponseShapeError);
    expect(() => normaliseBusArrival({ Services: 'not an array' }, BUS_STOP_CODE, FETCHED_AT)).toThrow(LtaResponseShapeError);
  });
});
