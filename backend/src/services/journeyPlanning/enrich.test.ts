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
    durationRangeSeconds: { min: 95, max: 105 },
    ...overrides,
  };
}

function walkLeg(overrides: Partial<WalkJourneyLeg> = {}): WalkJourneyLeg {
  return {
    mode: 'WALK',
    startTime: 't1',
    endTime: 't2',
    durationSeconds: 60,
    distanceMeters: 80,
    geometry: { type: 'LineString', coordinates: [[103.9, 1.32]] },
    fromName: 'A',
    toName: 'B',
    durationRangeSeconds: { min: 55, max: 65 },
    ...overrides,
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
    hasSevereCrowding: false,
    hasRainExposure: false,
    durationRangeSeconds: { min: 0, max: 0 },
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
    rainfall: { status: 'LIVE_EMPTY', provenance: 'LIVE', fetchedAt: FETCHED_AT, recordCount: 0, readings: [] },
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

  it('sets hasSevereCrowding when a rail leg has a HIGH crowding snapshot, not for MODERATE/LOW', () => {
    const highLive = emptyLiveContext({
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
    expect(enrichItinerary(itinerary([railLeg()]), highLive).hasSevereCrowding).toBe(true);

    const moderateLive = emptyLiveContext({ crowding: { ...highLive.crowding, events: [{ ...highLive.crowding.events[0]!, crowdLevel: 'MODERATE', rawCrowdLevel: 'm' }] } });
    expect(enrichItinerary(itinerary([railLeg()]), moderateLive).hasSevereCrowding).toBe(false);
  });

  it('sets hasRainExposure only when a long-enough walk leg is near an active rain gauge', () => {
    const live = emptyLiveContext({
      rainfall: {
        status: 'LIVE_SUCCESS',
        provenance: 'LIVE',
        fetchedAt: FETCHED_AT,
        recordCount: 1,
        readings: [
          {
            id: 'r1',
            source: 'DataGovSg',
            provenance: 'LIVE',
            lastUpdated: FETCHED_AT,
            stationId: 'S1',
            stationName: 'Bedok',
            latitude: 1.3201,
            longitude: 103.9001,
            valueMm: 1.5,
            timestamp: FETCHED_AT,
          },
        ],
      },
    });

    const longWalk = walkLeg({ distanceMeters: 400, geometry: { type: 'LineString', coordinates: [[103.9, 1.32]] } });
    expect(enrichItinerary(itinerary([longWalk]), live).hasRainExposure).toBe(true);

    const shortWalk = walkLeg({ distanceMeters: 50, geometry: { type: 'LineString', coordinates: [[103.9, 1.32]] } });
    expect(enrichItinerary(itinerary([shortWalk]), live).hasRainExposure).toBe(false);

    expect(enrichItinerary(itinerary([longWalk]), emptyLiveContext()).hasRainExposure).toBe(false);
  });

  it('widens a rail leg\'s durationRangeSeconds once it is disrupted', () => {
    const clean = enrichItinerary(itinerary([railLeg({ durationSeconds: 200 })]), emptyLiveContext());
    const cleanRange = (clean.legs[0] as RailJourneyLeg).durationRangeSeconds;

    const disruptedLive = emptyLiveContext({
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
            affectedStationCodes: ['EW6'],
          },
        ],
        messages: [],
      },
    });
    const disrupted = enrichItinerary(itinerary([railLeg({ durationSeconds: 200 })]), disruptedLive);
    const disruptedRange = (disrupted.legs[0] as RailJourneyLeg).durationRangeSeconds;

    expect(disruptedRange.max - disruptedRange.min).toBeGreaterThan(cleanRange.max - cleanRange.min);
    expect(disrupted.durationRangeSeconds).toEqual(disruptedRange);
  });
});
