import { describe, expect, it } from 'vitest';
import { resolveCanonicalLine, isCanonicalRailLine } from './railLine';

describe('resolveCanonicalLine', () => {
  it('maps TrainServiceAlerts LRT codes (STL/PTL) to canonical SKL/PGL', () => {
    expect(resolveCanonicalLine('STL', 'TrainServiceAlerts').canonical).toBe('SKL');
    expect(resolveCanonicalLine('PTL', 'TrainServiceAlerts').canonical).toBe('PGL');
  });

  it('maps StationCrowdDensity LRT codes (SLRT/PLRT) to the SAME canonical lines as STL/PTL', () => {
    expect(resolveCanonicalLine('SLRT', 'StationCrowdDensity').canonical).toBe('SKL');
    expect(resolveCanonicalLine('PLRT', 'StationCrowdDensity').canonical).toBe('PGL');
  });

  it('keeps Circle Line Extension distinct from Circle Line when the source separates them (StationCrowdDensity: CEL)', () => {
    expect(resolveCanonicalLine('CCL', 'StationCrowdDensity').canonical).toBe('CCL');
    expect(resolveCanonicalLine('CEL', 'StationCrowdDensity').canonical).toBe('CEL');
  });

  it('folds Circle Line Extension into CCL when the source does not separate it (TrainServiceAlerts)', () => {
    expect(resolveCanonicalLine('CCL', 'TrainServiceAlerts').canonical).toBe('CCL');
    // TrainServiceAlerts has no separate code for the extension at all.
    expect(resolveCanonicalLine('CEL', 'TrainServiceAlerts').canonical).toBeNull();
  });

  it('keeps the Changi Extension distinct from East West Line when the source separates them (StationCrowdDensity: CGL)', () => {
    expect(resolveCanonicalLine('EWL', 'StationCrowdDensity').canonical).toBe('EWL');
    expect(resolveCanonicalLine('CGL', 'StationCrowdDensity').canonical).toBe('CGL');
  });

  it('never guesses: an unrecognised raw code resolves to a null canonical while preserving the raw value', () => {
    const resolved = resolveCanonicalLine('XYZ', 'FacilitiesMaintenance');
    expect(resolved.canonical).toBeNull();
    expect(resolved.raw).toBe('XYZ');
    expect(resolved.source).toBe('FacilitiesMaintenance');
  });

  it('is case-insensitive and trims whitespace on the raw code', () => {
    expect(resolveCanonicalLine(' nel ', 'TrainServiceAlerts').canonical).toBe('NEL');
  });

  it('accepts both known vocabularies for FacilitiesMaintenance, since its Line field is not documented against either', () => {
    expect(resolveCanonicalLine('NEL', 'FacilitiesMaintenance').canonical).toBe('NEL');
    expect(resolveCanonicalLine('STL', 'FacilitiesMaintenance').canonical).toBe('SKL');
    expect(resolveCanonicalLine('SLRT', 'FacilitiesMaintenance').canonical).toBe('SKL');
  });

  it('maps "BPLRT" to Bukit Panjang LRT for FacilitiesMaintenance — a third code variant observed live, not in the guide', () => {
    expect(resolveCanonicalLine('BPLRT', 'FacilitiesMaintenance').canonical).toBe('BPL');
    // Not part of the documented TrainServiceAlerts/StationCrowdDensity vocabularies.
    expect(resolveCanonicalLine('BPLRT', 'TrainServiceAlerts').canonical).toBeNull();
    expect(resolveCanonicalLine('BPLRT', 'StationCrowdDensity').canonical).toBeNull();
  });
});

describe('isCanonicalRailLine', () => {
  it('accepts canonical codes and rejects raw endpoint-specific codes', () => {
    expect(isCanonicalRailLine('SKL')).toBe(true);
    expect(isCanonicalRailLine('STL')).toBe(false);
    expect(isCanonicalRailLine('SLRT')).toBe(false);
  });
});
