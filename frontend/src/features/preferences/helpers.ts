import { CommuterPreferences, TextSize } from '@/types';

export function getPreferencesSummary(prefs: CommuterPreferences): string[] {
  const tags: string[] = [];
  if (prefs.avoidStairs) tags.push('Step-free');
  if (prefs.requireWorkingLifts) tags.push('Working lifts');
  if (prefs.preferSheltered) tags.push('Mostly sheltered');
  if (prefs.minimiseWalking) tags.push('Low walking');
  if (prefs.preferFewerTransfers) tags.push('Simple transfers');
  if (prefs.avoidHighCrowding) tags.push('Low/Moderate crowding');
  return tags;
}

export function getTextSizeScaleFactor(size: TextSize): number {
  switch (size) {
    case 'large':
      return 1.15;
    case 'xlarge':
      return 1.3;
    default:
      return 1.0;
  }
}
