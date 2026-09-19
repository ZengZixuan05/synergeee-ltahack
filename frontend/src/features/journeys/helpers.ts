import { RouteOption } from '@/types';

export interface RouteDiff {
  timeDeltaMinutes: number;
  timeDeltaFormatted: string;
  walkingDeltaMeters: number;
  walkingDeltaFormatted: string;
  transfersDelta: number;
  stepFreeMaintained: boolean;
  workingLiftsMaintained: boolean;
  shelteredMaintained: boolean;
  summaryMessage: string;
}

export function calculateRouteDiff(usual: RouteOption, recommended: RouteOption): RouteDiff {
  const timeDelta = recommended.metrics.durationMinutes - usual.metrics.durationMinutes;
  const walkDelta = recommended.metrics.walkingDistanceMeters - usual.metrics.walkingDistanceMeters;
  const transferDelta = recommended.metrics.transfersCount - usual.metrics.transfersCount;

  const timeFormatted = timeDelta > 0 ? `+${timeDelta} min` : timeDelta < 0 ? `${timeDelta} min` : 'Same duration';
  const walkFormatted = walkDelta > 0 ? `+${walkDelta} m walking` : walkDelta < 0 ? `${walkDelta} m walking` : 'Same walking distance';

  return {
    timeDeltaMinutes: timeDelta,
    timeDeltaFormatted: timeFormatted,
    walkingDeltaMeters: walkDelta,
    walkingDeltaFormatted: walkFormatted,
    transfersDelta: transferDelta,
    stepFreeMaintained: recommended.metrics.isStepFree,
    workingLiftsMaintained: recommended.metrics.hasWorkingLifts,
    shelteredMaintained: recommended.metrics.isMostlySheltered,
    summaryMessage: recommended.metrics.isStepFree
      ? 'Remains step-free with confirmed working lifts'
      : 'Review accessibility requirements for this route',
  };
}
