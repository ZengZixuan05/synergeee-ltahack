import { describe, expect, it } from 'vitest';
import { normaliseBusServices } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors a real live BusServices record (2026-09-19).
const SERVICE_10_DIR1 = {
  ServiceNo: '10',
  Operator: 'GAS',
  Direction: 1,
  Category: 'TRUNK',
  OriginCode: '75009',
  DestinationCode: '16009',
  AM_Peak_Freq: '09-10',
  AM_Offpeak_Freq: '09-16',
  PM_Peak_Freq: '11-16',
  PM_Offpeak_Freq: '16-18',
  LoopDesc: '',
};

describe('normaliseBusServices', () => {
  it('normalises a valid record, treating an empty LoopDesc as absent (not a loop)', () => {
    const { records, skippedCount } = normaliseBusServices([SERVICE_10_DIR1], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records[0]).toMatchObject({
      id: 'bus-service:10:1',
      serviceNo: '10',
      operator: 'GAS',
      direction: 1,
      category: 'TRUNK',
      amPeakFreq: '09-10',
    });
    expect(records[0]!.loopDescription).toBeUndefined();
  });

  it('generates distinct ids for the same ServiceNo in each direction', () => {
    const dir2 = { ...SERVICE_10_DIR1, Direction: 2, OriginCode: '16009', DestinationCode: '75009' };
    const { records } = normaliseBusServices([SERVICE_10_DIR1, dir2], FETCHED_AT);
    expect(records[0]!.id).not.toBe(records[1]!.id);
  });

  it('preserves a real LoopDesc value', () => {
    const loop = { ...SERVICE_10_DIR1, LoopDesc: 'Raffles Blvd' };
    const { records } = normaliseBusServices([loop], FETCHED_AT);
    expect(records[0]!.loopDescription).toBe('Raffles Blvd');
  });
});
