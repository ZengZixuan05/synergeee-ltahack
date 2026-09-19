import { describe, expect, it } from 'vitest';
import { normaliseTrainServiceAlerts } from './normalise';
import { LtaResponseShapeError } from '../../lta/errors';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors the actual live response (2026-09-19): no active disruption, but
// two unrelated general advisories.
const NORMAL_RESPONSE = {
  'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#TrainServicesAlerts',
  value: {
    Status: 1,
    AffectedSegments: [],
    Message: [
      { Content: 'Planned works notice A', CreatedDate: '2026-09-18 20:06:30' },
      { Content: 'Planned works notice B', CreatedDate: '2026-04-18 11:50:27' },
    ],
  },
};

// Mirrors the guide's Annex C disruption sample.
const DISRUPTED_RESPONSE = {
  value: {
    Status: 2,
    AffectedSegments: [
      {
        Line: 'NEL',
        Direction: 'HarbourFront',
        Stations: 'NE9,NE8,NE7,NE6',
        FreePublicBus: 'NE9,NE8,NE7,NE6',
        FreeMRTShuttle: 'NE9,NE8,NE7,NE6',
        MRTShuttleDirection: 'HarbourFront',
      },
    ],
    Message: [{ Content: '1657hrs: NEL disruption', CreatedDate: '2017-12-11 16:57:25' }],
  },
};

describe('normaliseTrainServiceAlerts', () => {
  it('produces zero events for a normal (no disruption) response, but still surfaces general advisories', () => {
    const { events, messages } = normaliseTrainServiceAlerts(NORMAL_RESPONSE, FETCHED_AT);
    expect(events).toEqual([]);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ content: 'Planned works notice A', createdDate: '2026-09-18 20:06:30' });
  });

  it('normalises an active disruption into one TRAIN_SERVICE_ALERT event per affected segment', () => {
    const { events } = normaliseTrainServiceAlerts(DISRUPTED_RESPONSE, FETCHED_AT);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'TRAIN_SERVICE_ALERT',
      source: 'LTA',
      provenance: 'LIVE',
      line: 'NEL',
      rawLine: 'NEL',
      direction: 'HarbourFront',
      affectedStationCodes: ['NE9', 'NE8', 'NE7', 'NE6'],
      freePublicBus: 'NE9,NE8,NE7,NE6',
      freeMrtShuttle: 'NE9,NE8,NE7,NE6',
      mrtShuttleDirection: 'HarbourFront',
    });
  });

  it('resolves an LRT line code correctly (STL -> canonical SKL)', () => {
    const response = {
      value: { Status: 2, AffectedSegments: [{ Line: 'STL', Stations: 'STC,SW1' }], Message: [] },
    };
    const { events } = normaliseTrainServiceAlerts(response, FETCHED_AT);
    expect(events[0]!.line).toBe('SKL');
    expect(events[0]!.rawLine).toBe('STL');
  });

  it('preserves "Free bus service island wide" verbatim rather than treating it as a station code list', () => {
    const response = {
      value: {
        Status: 2,
        AffectedSegments: [{ Line: 'EWL', Stations: 'EW1,EW2', FreePublicBus: 'Free bus service island wide' }],
        Message: [],
      },
    };
    const { events } = normaliseTrainServiceAlerts(response, FETCHED_AT);
    expect(events[0]!.freePublicBus).toBe('Free bus service island wide');
  });

  it('throws LtaResponseShapeError for a completely malformed response rather than guessing', () => {
    expect(() => normaliseTrainServiceAlerts({ value: 'not an object' }, FETCHED_AT)).toThrow(LtaResponseShapeError);
    expect(() => normaliseTrainServiceAlerts(null, FETCHED_AT)).toThrow(LtaResponseShapeError);
  });
});
