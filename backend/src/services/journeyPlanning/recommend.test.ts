import { describe, expect, it } from 'vitest';
import { recommendItinerary } from './recommend';
import { JourneyItinerary } from '../../models/journey';

function itinerary(overrides: Partial<JourneyItinerary> = {}): JourneyItinerary {
  return {
    startTime: 't1',
    endTime: 't2',
    durationSeconds: 100,
    walkDistanceMeters: 0,
    transfers: 0,
    legs: [],
    hasDisruption: false,
    hasLiftWarning: false,
    ...overrides,
  };
}

describe('recommendItinerary', () => {
  it('returns undefined for an empty itinerary list', () => {
    expect(recommendItinerary([])).toBeUndefined();
  });

  it('recommends the fastest itinerary when it has no issues', () => {
    const result = recommendItinerary([itinerary()]);
    expect(result).toEqual({ index: 0, reason: 'No live disruptions or lift outages reported on this route right now.' });
  });

  it('recommends a later, clean itinerary over a disrupted faster one, and says why', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true }), itinerary()]);
    expect(result?.index).toBe(1);
    expect(result?.reason).toContain('a live service disruption');
    expect(result?.reason).toContain('this option avoids both');
  });

  it('mentions both issues when the fastest itinerary has a disruption AND a lift warning', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true, hasLiftWarning: true }), itinerary()]);
    expect(result?.reason).toContain('a live service disruption');
    expect(result?.reason).toContain('a lift under maintenance');
  });

  it('falls back to the fastest option when every itinerary has an issue, and says so honestly', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true }), itinerary({ hasLiftWarning: true })]);
    expect(result?.index).toBe(0);
    expect(result?.reason).toContain('Every option currently has');
  });
});
