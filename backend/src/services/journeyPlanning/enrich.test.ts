import { describe, expect, it } from 'vitest';
import { enrichItinerary, LiveContext } from './enrich';
import { JourneyItinerary, RailJourneyLeg, WalkJourneyLeg } from '../../models/journey';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

function railLeg(overrides: Partial<RailJourneyLeg> = {}): RailJourneyLeg {
  return {
    mode: 'RAIL',
    startTime: 't1',
    endTime: 't2',
    durationSeconds: 100,
    distanceMeters: 1000,
    geometry: { type: 'LineString', coordinates: [] },
    line: 'EWL',
    rawLine: 'EW',
    fromStationCode: 'EW5',
    fromStationName: 'BEDOK MRT STATION',
    toStationCode: 'EW16',
    toStationName: 'OUTRAM PARK MRT STATION',
    intermediateStationCodes: ['EW6'],
    ...overrides,
  };
}

function walkLeg(): WalkJourneyLeg {
  return {
    mode: 'WALK',
    startTime: 't1',
    endTime: 't2',
    durationSeconds: 60,
    distanceMeters: 80,
    geometry: { type: 'LineString', coordinates: [] },
    fromName: 'A',
    toName: 'B',
  };
}

function itinerary(legs: JourneyItinerary['legs']): JourneyItinerary {
  return {
    startTime: 't1',
    endTime: 't2',
    durationSeconds: 100,
    walkDistanceMeters: 0,
    transfers: 0,
    legs,
    hasDisruption: false,
    hasLiftWarning: false,
  };
}

function emptyLiveContext(overrides: Partial<LiveContext> = {}): LiveContext {
  return {
    alerts: { status: 'LIVE_EMPTY', provenance: 'LIVE', fetchedAt: FETCHED_AT, recordCount: 0, events: [], messages: [] },
    facilities: {
      status: 'LIVE_EMPTY',
      provenance: 'LIVE',
      fetchedAt: FETCHED_AT,
      recordCount: 0,
      skippedRecordCount: 0,
      events: [],
    },
    crowding: {
      status: 'LIVE_EMPTY',
      provenance: 'LIVE',
      fetchedAt: FETCHED_AT,
      recordCount: 0,
      skippedLineCount: 0,
      events: [],
    },
    ...overrides,
  };
}

describe('enrichItinerary', () => {
  it('marks a RAIL leg not disrupted when there is no matching TrainServiceAlerts entry', () => {
    const result = enrichItinerary(itinerary([railLeg()]), emptyLiveContext());
    const leg = result.legs[0] as RailJourneyLeg;
    expect(leg.live?.disrupted).toBe(false);
    expect(result.hasDisruption).toBe(false);
  });

  it('marks a RAIL leg disrupted when a live alert affects the same line and overlaps a station on this leg', () => {
    const live = emptyLiveContext({
      alerts: {
        status: 'LIVE_SUCCESS',
        provenance: 'LIVE',
        fetchedAt: FETCHED_AT,
        recordCount: 1,
        events: [
          {
            id: 'x',
            type: 'TRAIN_SERVICE_ALERT',
            source: 'LTA',
            provenance: 'LIVE',
            lastUpdated: FETCHED_AT,
            line: 'EWL',
            rawLine: 'EWL',
            direction: 'HarbourFront',
            affectedStationCodes: ['EW6'], // matches the RAIL leg's intermediate stop
          },
        ],
        messages: [{ content: '1657hrs: EWL disruption near Kembangan', createdDate: '2026-09-19 16:57:00' }],
      },
    });

    const result = enrichItinerary(itinerary([railLeg()]), live);
    const leg = result.legs[0] as RailJourneyLeg;
    expect(leg.live?.disrupted).toBe(true);
    expect(leg.live?.disruptionMessage).toContain('EWL disruption');
    expect(result.hasDisruption).toBe(true);
  });

  it('does not flag a leg as disrupted when the alert is on a different line, even if station codes coincidentally overlap', () => {
    const live = emptyLiveContext({
      alerts: {
        status: 'LIVE_SUCCESS',
        provenance: 'LIVE',
        fetchedAt: FETCHED_AT,
        recordCount: 1,
        events: [
          {
            id: 'x',
            type: 'TRAIN_SERVICE_ALERT',
            source: 'LTA',
            provenance: 'LIVE',
            lastUpdated: FETCHED_AT,
            line: 'NSL', // different line
            rawLine: 'NSL',
            affectedStationCodes: ['EW6'],
          },
        ],
        messages: [],
      },
    });
    const result = enrichItinerary(itinerary([railLeg()]), live);
    expect((result.legs[0] as RailJourneyLeg).live?.disrupted).toBe(false);
  });

  it('attaches a lift warning when FacilitiesMaintenance reports a lift down at a station this leg passes through', () => {
    const live = emptyLiveContext({
      facilities: {
        status: 'LIVE_SUCCESS',
        provenance: 'LIVE',
        fetchedAt: FETCHED_AT,
        recordCount: 1,
        skippedRecordCount: 0,
        events: [
          {
            id: 'lift-1',
            type: 'LIFT_MAINTENANCE',
            source: 'LTA',
            provenance: 'LIVE',
            lastUpdated: FETCHED_AT,
            station: { stationCode: 'EW16', stationName: 'OUTRAM PARK MRT STATION', line: 'EWL', rawLine: 'EWL' },
            liftId: 'B1L01',
            liftDescription: 'Exit A Street level - Concourse',
          },
        ],
      },
    });

    const result = enrichItinerary(itinerary([railLeg()]), live);
    const leg = result.legs[0] as RailJourneyLeg;
    expect(leg.live?.liftWarnings).toHaveLength(1);
    expect(leg.live?.liftWarnings[0]).toMatchObject({ stationCode: 'EW16', liftId: 'B1L01' });
    expect(result.hasLiftWarning).toBe(true);
  });

  it('attaches crowding snapshots for stations this leg passes through', () => {
    const live = emptyLiveContext({
      crowding: {
        status: 'LIVE_SUCCESS',
        provenance: 'LIVE',
        fetchedAt: FETCHED_AT,
        recordCount: 1,
        skippedLineCount: 0,
        events: [
          {
            id: 'c1',
            type: 'STATION_CROWDING_OBSERVED',
            source: 'LTA',
            provenance: 'LIVE',
            lastUpdated: FETCHED_AT,
            stationCode: 'EW5',
            line: 'EWL',
            rawLine: 'EWL',
            crowdLevel: 'HIGH',
            rawCrowdLevel: 'h',
          },
        ],
      },
    });
    const result = enrichItinerary(itinerary([railLeg()]), live);
    const leg = result.legs[0] as RailJourneyLeg;
    expect(leg.live?.crowding).toEqual([{ stationCode: 'EW5', crowdLevel: 'HIGH' }]);
  });

  it('leaves WALK/BUS legs untouched (no `live` field added)', () => {
    const result = enrichItinerary(itinerary([walkLeg()]), emptyLiveContext());
    expect(result.legs[0]).not.toHaveProperty('live');
  });
});
