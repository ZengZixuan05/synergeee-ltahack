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
    hasSevereCrowding: false,
    hasRainExposure: false,
    durationRangeSeconds: { min: 100, max: 100 },
    ...overrides,
  };
}

describe('recommendItinerary', () => {
  it('returns undefined for an empty itinerary list', () => {
    expect(recommendItinerary([])).toBeUndefined();
  });

  it('recommends the fastest itinerary when it has no issues', () => {
    const result = recommendItinerary([itinerary()]);
    expect(result).toEqual({
      index: 0,
      reason: 'No live disruptions, lift outages, severe crowding, or rain exposure reported on this route right now.',
    });
  });

  it('recommends a later, clean itinerary over a disrupted faster one, and says why', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true }), itinerary()]);
    expect(result?.index).toBe(1);
    expect(result?.reason).toContain('a live service disruption');
    expect(result?.reason).toContain('this option avoids that');
  });

  it('mentions both issues when the fastest itinerary has a disruption AND a lift warning', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true, hasLiftWarning: true }), itinerary()]);
    expect(result?.reason).toContain('a live service disruption');
    expect(result?.reason).toContain('a lift under maintenance');
    expect(result?.reason).toContain('this option avoids those');
  });

  it('prefers a lift-warning-only option over a disrupted one — disruption outranks a lift warning as a bigger issue', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true }), itinerary({ hasLiftWarning: true })]);
    expect(result?.index).toBe(1);
    expect(result?.reason).toContain('a live service disruption');
  });

  it('falls back to the fastest option when nothing scores better, and says so honestly', () => {
    const result = recommendItinerary([itinerary({ hasDisruption: true }), itinerary({ hasDisruption: true })]);
    expect(result?.index).toBe(0);
    expect(result?.reason).toContain('still the best option');
  });

  it('treats severe crowding and rain exposure as lower-priority than disruption/lift warnings', () => {
    const result = recommendItinerary([itinerary({ hasSevereCrowding: true }), itinerary({ hasDisruption: true })]);
    expect(result?.index).toBe(0);
    expect(result?.reason).toContain('still the best option');
  });

  it('avoids severe crowding when the fastest option has it and an alternative does not', () => {
    const result = recommendItinerary([itinerary({ hasSevereCrowding: true }), itinerary()]);
    expect(result?.index).toBe(1);
    expect(result?.reason).toContain('HIGH crowding');
  });

  it('avoids rain exposure when the fastest option has it and an alternative does not', () => {
    const result = recommendItinerary([itinerary({ hasRainExposure: true }), itinerary()]);
    expect(result?.index).toBe(1);
    expect(result?.reason).toContain('rain-exposed walk');
  });
});
