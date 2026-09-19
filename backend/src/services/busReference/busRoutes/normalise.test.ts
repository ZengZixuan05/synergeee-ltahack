import { describe, expect, it } from 'vitest';
import { normaliseBusRoutes } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors a real live BusRoutes record (2026-09-19).
const STOP_1 = {
  ServiceNo: '10',
  Operator: 'GAS',
  Direction: 1,
  StopSequence: 1,
  BusStopCode: '75009',
  Distance: 0,
  WD_FirstBus: '0500',
  WD_LastBus: '2300',
  SAT_FirstBus: '0500',
  SAT_LastBus: '2300',
  SUN_FirstBus: '0500',
  SUN_LastBus: '2300',
};

describe('normaliseBusRoutes', () => {
  it('normalises a valid route-stop record', () => {
    const { records, skippedCount } = normaliseBusRoutes([STOP_1], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records[0]).toMatchObject({
      id: 'bus-route-stop:10:1:1',
      serviceNo: '10',
      direction: 1,
      stopSequence: 1,
      busStopCode: '75009',
      distanceKm: 0,
      weekdayFirstBus: '0500',
    });
  });

  it('generates a distinct id per (ServiceNo, Direction, StopSequence)', () => {
    const stop2 = { ...STOP_1, StopSequence: 2, BusStopCode: '76059', Distance: 0.6 };
    const { records } = normaliseBusRoutes([STOP_1, stop2], FETCHED_AT);
    expect(records[0]!.id).not.toBe(records[1]!.id);
  });

  it('skips a malformed record rather than discarding the whole (potentially very large) batch', () => {
    const { records, skippedCount } = normaliseBusRoutes([STOP_1, { ServiceNo: '10' }], FETCHED_AT);
    expect(records).toHaveLength(1);
    expect(skippedCount).toBe(1);
  });
});
