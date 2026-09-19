import { describe, expect, it } from 'vitest';
import { normalisePcdForecast } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

describe('normalisePcdForecast', () => {
  it('produces one record per (station, date), preserving the full interval list rather than exploding into one record per interval', () => {
    const byLine = [
      {
        trainLine: 'EWL' as const,
        raw: {
          value: [
            {
              Date: '2026-09-19T00:00:00+08:00',
              Stations: [
                {
                  Station: 'EW1',
                  Interval: [
                    { Start: '2026-09-19T00:00:00+08:00', CrowdLevel: 'l' },
                    { Start: '2026-09-19T00:30:00+08:00', CrowdLevel: 'm' },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];

    const { records, skippedLineCount } = normalisePcdForecast(byLine, FETCHED_AT);

    expect(skippedLineCount).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ stationCode: 'EW1', line: 'EWL', date: '2026-09-19T00:00:00+08:00' });
    expect(records[0]!.intervals).toEqual([
      { start: '2026-09-19T00:00:00+08:00', crowdLevel: 'LOW', rawCrowdLevel: 'l' },
      { start: '2026-09-19T00:30:00+08:00', crowdLevel: 'MODERATE', rawCrowdLevel: 'm' },
    ]);
  });

  it('skips a line whose response is malformed, without affecting other lines', () => {
    const byLine = [
      { trainLine: 'EWL' as const, raw: { value: [{ Date: 'd', Stations: [{ Station: 'EW1', Interval: [] }] }] } },
      { trainLine: 'NSL' as const, raw: { notValue: [] } },
    ];
    const { records, skippedLineCount } = normalisePcdForecast(byLine, FETCHED_AT);
    expect(records).toHaveLength(1);
    expect(skippedLineCount).toBe(1);
  });
});
