export type NotificationSource = 'train' | 'lift' | 'weather' | 'crowding';
export type NotificationSeverity = 'low' | 'moderate' | 'critical';

/** A single item in the notification center — normalized from whichever live LTA/weather feed it came from. */
export interface NotificationItem {
  id: string;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  description?: string;
  timestamp: string; // ISO
  provenance: 'LIVE' | 'DEMO';
}
