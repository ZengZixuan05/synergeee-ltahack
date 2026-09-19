import { TransportAlert } from '@/types';

export const SAMPLE_TRANSPORT_ALERTS: TransportAlert[] = [
  {
    id: 'alert-1',
    title: 'East West Line · Normal Frequency Restored',
    description: 'Earlier platform track inspection between Kembangan and Bedok completed. Trains operating at normal peak 2-3 min intervals.',
    severity: 'low',
    category: 'rail',
    updatedAt: '12 min ago',
    affectedLineOrStation: 'East West Line',
    isSampleData: true,
  },
  {
    id: 'alert-2',
    title: 'Passing Morning Showers Forecast',
    description: 'Brief showers expected across eastern and southern Singapore between 8:30 AM – 10:15 AM. Sheltered linkways fully open.',
    severity: 'moderate',
    category: 'weather',
    updatedAt: '25 min ago',
    affectedLineOrStation: 'Bedok / Outram',
    isSampleData: true,
  },
  {
    id: 'alert-3',
    title: 'Outram Park Interchange · Concourse Crowding',
    description: 'Moderate passenger flow reported near Exit 3 transfer tunnel. Barrier-free lift pathways remain clear and unimpeded.',
    severity: 'low',
    category: 'crowding',
    updatedAt: '40 min ago',
    affectedLineOrStation: 'Outram Park MRT',
    isSampleData: true,
  },
];
