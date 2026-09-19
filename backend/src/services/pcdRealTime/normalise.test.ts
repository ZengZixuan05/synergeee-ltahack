import { describe, expect, it } from 'vitest';
import { normalisePcdRealTime } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

describe('normalisePcdRealTime', () => {
  it('normalises stations from multiple lines, resolving each line only from the queried TrainLine, not the station code', () => {
    const byLine = [
      {
        trainLine: 'EWL' as const,
        raw: { value: [{ Station: 'EW1', StartTime: '2026-09-19T09:40:00+08:00', EndTime: '2026-09-19T09:50:00+08:00', CrowdLevel: 'l' }] },
      },
      {
        trainLine: 'SLRT' as const,
        raw: { value: [{ Station: 'STC', StartTime: '2026-09-19T09:40:00+08:00', EndTime: '2026-09-19T09:50:00+08:00', CrowdLevel: 'h' }] },
      },
    ];

    const { events, skippedLineCount } = normalisePcdRealTime(byLine, FETCHED_AT);

    expect(skippedLineCount).toBe(0);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: 'STATION_CROWDING_OBSERVED', stationCode: 'EW1', line: 'EWL', crowdLevel: 'LOW', rawCrowdLevel: 'l' });
    // SLRT (StationCrowdDensity vocabulary) resolves to the SAME canonical line as STL does for TrainServiceAlerts.
    expect(events[1]).toMatchObject({ stationCode: 'STC', line: 'SKL', rawLine: 'SLRT', crowdLevel: 'HIGH' });
  });

  it('maps an unrecognised CrowdLevel code to UNKNOWN rather than guessing', () => {
    const byLine = [{ trainLine: 'EWL' as const, raw: { value: [{ Station: 'EW1', StartTime: 't1', EndTime: 't2', CrowdLevel: 'NA' }] } }];
    const { events } = normalisePcdRealTime(byLine, FETCHED_AT);
    expect(events[0]!.crowdLevel).toBe('UNKNOWN');
    expect(events[0]!.rawCrowdLevel).toBe('NA');
  });

  it('skips a line whose response is malformed, without affecting other lines', () => {
    const byLine = [
      { trainLine: 'EWL' as const, raw: { value: [{ Station: 'EW1', StartTime: 't1', EndTime: 't2', CrowdLevel: 'l' }] } },
      { trainLine: 'NSL' as const, raw: { notValue: [] } },
    ];
    const { events, skippedLineCount } = normalisePcdRealTime(byLine, FETCHED_AT);
    expect(events).toHaveLength(1);
    expect(skippedLineCount).toBe(1);
  });
});
