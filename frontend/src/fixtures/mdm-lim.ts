import { Commuter } from '@/types';

export const MDM_LIM_COMMUTER: Commuter = {
  id: 'commuter-mdm-lim',
  name: 'Mdm Lim',
  greetingTitle: 'Good evening, Mdm Lim',
  homeLocation: {
    name: 'Sky Eden @ Bedok',
    address: '1 Bedok Central, Singapore 469657',
    postalCode: '469657',
  },
  preferences: {
    minimiseWalking: true,
    preferSheltered: true,
    preferFewerTransfers: true,
    avoidHighCrowding: true,
    transportModes: ['rail', 'bus', 'walking'],
    avoidStairs: true,
    requireWorkingLifts: true,
    wheelchairMode: false,
    walkingPace: 'slow',
    maxContinuousWalk: '400m',
    textSize: 'large',
    language: 'en',
    notifications: {
      plannedDisruptions: true,
      unexpectedDisruptions: true,
      weatherDisruptions: true,
      crowdingDisruptions: true,
    },
  },
};
