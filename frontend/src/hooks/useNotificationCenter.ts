'use client';

import { useMemo } from 'react';
import { useTrainServiceAlerts } from './useTrainServiceAlerts';
import { useLiftMaintenance } from './useLiftMaintenance';
import { useWeather } from './useWeather';
import { useStationCrowding } from './useStationCrowding';
import { NotificationItem } from '@/types/notification';
import { CommuterPreferences } from '@/types';

interface UseNotificationCenterResult {
  items: NotificationItem[];
  isLoading: boolean;
}

const MAX_ITEMS = 20;

/**
 * Aggregates every live alert/weather/crowding feed this app already fetches
 * into one normalized notification list, gated by the commuter's own
 * "Proactive Notifications" preferences (frontend/src/app/profile/page.tsx)
 * — the first thing in this codebase that actually reads those toggles.
 * LTA's TrainServiceAlerts feed doesn't distinguish planned from unexpected
 * disruptions, so `plannedDisruptions`/`unexpectedDisruptions` jointly gate
 * the same train-alert items (either one being on is enough) rather than
 * inventing a distinction the data doesn't provide.
 */
export function useNotificationCenter(notifications: CommuterPreferences['notifications']): UseNotificationCenterResult {
  const trainAlerts = useTrainServiceAlerts();
  const liftMaintenance = useLiftMaintenance();
  const weather = useWeather();
  const crowding = useStationCrowding();

  const items = useMemo(() => {
    const result: NotificationItem[] = [];

    if (notifications.plannedDisruptions || notifications.unexpectedDisruptions) {
      for (const event of trainAlerts.events) {
        result.push({
          id: event.id,
          source: 'train',
          severity: 'critical',
          title: `${event.line ?? event.rawLine} service disruption`,
          description: event.affectedStationCodes.length > 0 ? `Affected: ${event.affectedStationCodes.join(', ')}` : undefined,
          timestamp: event.lastUpdated,
          provenance: event.provenance,
        });
      }

      for (const event of liftMaintenance.events) {
        result.push({
          id: event.id,
          source: 'lift',
          severity: 'moderate',
          title: `Lift down at ${event.station.stationName || event.station.stationCode}`,
          description: event.liftDescription,
          timestamp: event.lastUpdated,
          provenance: event.provenance,
        });
      }
    }

    if (notifications.weatherDisruptions) {
      for (const area of weather.areas) {
        if (!area.isRaining) continue;
        result.push({
          id: area.id,
          source: 'weather',
          severity: 'low',
          title: `Rain in ${area.area}`,
          description: area.forecast,
          timestamp: area.lastUpdated,
          provenance: area.provenance,
        });
      }
    }

    if (notifications.crowdingDisruptions) {
      for (const event of crowding.events) {
        if (event.crowdLevel !== 'HIGH') continue;
        result.push({
          id: event.id,
          source: 'crowding',
          severity: 'moderate',
          title: `High crowding at ${event.stationCode}`,
          description: event.line ?? event.rawLine,
          timestamp: event.lastUpdated,
          provenance: event.provenance,
        });
      }
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, MAX_ITEMS);
  }, [
    notifications.plannedDisruptions,
    notifications.unexpectedDisruptions,
    notifications.weatherDisruptions,
    notifications.crowdingDisruptions,
    trainAlerts.events,
    liftMaintenance.events,
    weather.areas,
    crowding.events,
  ]);

  const isLoading =
    trainAlerts.status === 'loading' ||
    liftMaintenance.status === 'loading' ||
    weather.status === 'loading' ||
    crowding.status === 'loading';

  return { items, isLoading };
}
