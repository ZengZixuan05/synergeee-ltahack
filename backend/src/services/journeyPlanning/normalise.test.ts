import { describe, expect, it } from 'vitest';
import { normaliseJourneyPlan } from './normalise';
import { OneMapResponseShapeError } from '../../onemap/errors';

// Mirrors a real live OneMap routeType=pt response for Bedok -> SGH
// (2026-09-19): RAIL (SUBWAY) -> WALK -> BUS -> WALK, door to door.
const LIVE_RESPONSE = {
  plan: {
    itineraries: [
      {
        duration: 2065,
        startTime: 1789781608000,
        endTime: 1789783673000,
        walkDistance: 521.33,
        transfers: 1,
        fare: '2.02',
        legs: [
          {
            startTime: 1789781608000,
            endTime: 1789782960000,
            distance: 13183.34,
            mode: 'SUBWAY',
            route: 'EW',
            from: { name: 'BEDOK MRT STATION', stopCode: 'EW5', lon: 103.9301702, lat: 1.32403 },
            to: { name: 'OUTRAM PARK MRT STATION', stopCode: 'EW16', lon: 103.8389844, lat: 1.2815273 },
            intermediateStops: [{ name: 'KEMBANGAN MRT STATION', stopCode: 'EW6', lon: 103.9129522, lat: 1.3210355 }],
            legGeometry: { points: 'ohyFs`xxR?GBE@@DG@@TJEHCBg@b@A@GF??CD?@B@' },
          },
          {
            startTime: 1789782960000,
            endTime: 1789783048000,
            distance: 78.54,
            mode: 'WALK',
            route: '',
            from: { name: 'OUTRAM PARK MRT STATION', stopCode: 'EW16', lon: 103.8389844, lat: 1.2815273 },
            to: { name: 'OUTRAM PK STN EXIT 1', stopCode: '06029', lon: 103.838666, lat: 1.2816491 },
            legGeometry: { points: 'ohyFs`xxR?GBE@@DG@@TJEHCBg@b@A@GF??CD?@B@' },
          },
          {
            startTime: 1789783048000,
            endTime: 1789783600000,
            distance: 562.84,
            mode: 'BUS',
            route: '174',
            from: { name: 'OUTRAM PK STN EXIT 1', stopCode: '06029', lon: 103.838666, lat: 1.2816491 },
            to: { name: 'BEF NEIL RD', stopCode: '05119', lon: 103.8378, lat: 1.279 },
          },
          {
            startTime: 1789783600000,
            endTime: 1789783673000,
            distance: 442.79,
            mode: 'WALK',
            route: '',
            from: { name: 'BEF NEIL RD', stopCode: '05119', lon: 103.8378, lat: 1.279 },
            to: { name: 'Destination', lon: 103.834854, lat: 1.279367 },
          },
        ],
      },
    ],
  },
};

describe('normaliseJourneyPlan', () => {
  it('normalises a full door-to-door multi-modal itinerary (RAIL -> WALK -> BUS -> WALK)', () => {
    const itineraries = normaliseJourneyPlan(LIVE_RESPONSE);

    expect(itineraries).toHaveLength(1);
    const itinerary = itineraries[0]!;
    expect(itinerary.durationSeconds).toBe(2065);
    expect(itinerary.fare).toBe('2.02');
    expect(itinerary.legs.map((l) => l.mode)).toEqual(['RAIL', 'WALK', 'BUS', 'WALK']);
  });

  it('resolves the RAIL leg\'s line via the OneMapRouting vocabulary ("EW" -> canonical "EWL")', () => {
    const [itinerary] = normaliseJourneyPlan(LIVE_RESPONSE);
    const railLeg = itinerary!.legs[0]!;
    expect(railLeg.mode).toBe('RAIL');
    if (railLeg.mode === 'RAIL') {
      expect(railLeg.line).toBe('EWL');
      expect(railLeg.rawLine).toBe('EW');
      expect(railLeg.fromStationCode).toBe('EW5');
      expect(railLeg.toStationCode).toBe('EW16');
      expect(railLeg.intermediateStationCodes).toEqual(['EW6']);
    }
  });

  it('decodes each leg\'s geometry into real WGS84 coordinates', () => {
    const [itinerary] = normaliseJourneyPlan(LIVE_RESPONSE);
    const railLeg = itinerary!.legs[0]!;
    expect(railLeg.geometry.type).toBe('LineString');
    expect((railLeg.geometry as { coordinates: number[][] }).coordinates.length).toBeGreaterThan(0);
  });

  it('normalises the BUS leg with its real service number and stop codes', () => {
    const [itinerary] = normaliseJourneyPlan(LIVE_RESPONSE);
    const busLeg = itinerary!.legs[2]!;
    expect(busLeg.mode).toBe('BUS');
    if (busLeg.mode === 'BUS') {
      expect(busLeg.serviceNo).toBe('174');
      expect(busLeg.fromStopCode).toBe('06029');
      expect(busLeg.toStopCode).toBe('05119');
    }
  });

  it('sets hasDisruption/hasLiftWarning to false before enrichment runs', () => {
    const [itinerary] = normaliseJourneyPlan(LIVE_RESPONSE);
    expect(itinerary!.hasDisruption).toBe(false);
    expect(itinerary!.hasLiftWarning).toBe(false);
  });

  it('treats a response with no plan (no route found) as zero itineraries, not an error', () => {
    expect(normaliseJourneyPlan({})).toEqual([]);
  });

  it('skips a leg with an unrecognised mode rather than guessing what it is', () => {
    const withUnknownMode = {
      plan: {
        itineraries: [
          {
            duration: 100,
            startTime: 1,
            endTime: 2,
            legs: [
              { startTime: 1, endTime: 2, distance: 1, mode: 'FERRY', from: { lon: 1, lat: 1 }, to: { lon: 1, lat: 1 } },
            ],
          },
        ],
      },
    };
    const [itinerary] = normaliseJourneyPlan(withUnknownMode);
    expect(itinerary!.legs).toEqual([]);
  });

  it('throws OneMapResponseShapeError for a completely malformed response', () => {
    expect(() => normaliseJourneyPlan(null)).toThrow(OneMapResponseShapeError);
    expect(() => normaliseJourneyPlan({ plan: { itineraries: 'not an array' } })).toThrow(OneMapResponseShapeError);
  });
});
