import { RouteOption } from '@/types';
import { MDM_LIM_RECOMMENDED_STEPS } from './guided-journey';

export const SAMPLE_USUAL_ROUTE: RouteOption = {
  id: 'route-usual',
  title: 'Usual route',
  badgeType: 'usual',
  metrics: {
    durationMinutes: 58,
    durationRange: '54–61 min',
    walkingDistanceMeters: 340,
    transfersCount: 1,
    crowding: 'moderate',
    shelteredPercentage: 88,
    isStepFree: true,
    hasWorkingLifts: true,
    isMostlySheltered: true,
  },
  departureTime: '8:45 AM',
  arrivalTime: '9:45–9:53 AM',
  departureLocation: 'Sky Eden @ Bedok',
  arrivalLocation: 'Singapore General Hospital (Clinic 4A)',
  summarySteps: [
    'Walk 320 m to Bedok MRT',
    'East West Line (6 stops to Outram Park)',
    'Transfer via Exit A lift',
    'Walk 20 m to SGH Block 4',
  ],
  steps: MDM_LIM_RECOMMENDED_STEPS,
};

export const SAMPLE_AFFECTED_ROUTE: RouteOption = {
  id: 'route-affected',
  title: 'Usual route',
  badgeType: 'affected',
  affectedReason: 'Lift unavailable on this route',
  metrics: {
    durationMinutes: 58,
    durationRange: '54–61 min',
    walkingDistanceMeters: 340,
    transfersCount: 1,
    crowding: 'moderate',
    shelteredPercentage: 88,
    isStepFree: false, // Step-free broken because lift is down!
    hasWorkingLifts: false,
    isMostlySheltered: true,
  },
  departureTime: '8:45 AM',
  arrivalTime: '9:45–9:53 AM',
  departureLocation: 'Sky Eden @ Bedok',
  arrivalLocation: 'Singapore General Hospital (Clinic 4A)',
  summarySteps: [
    'Walk 320 m to Bedok MRT',
    'East West Line (6 stops to Outram Park)',
    'Outram Park Exit A lift is out of service (Stairs required)',
    'Walk 20 m to SGH Block 4',
  ],
  steps: MDM_LIM_RECOMMENDED_STEPS,
};

export const SAMPLE_RECOMMENDED_ROUTE: RouteOption = {
  id: 'route-recommended',
  title: 'Recommended accessible route',
  badgeType: 'recommended',
  isRecommendedAlternative: true,
  metrics: {
    durationMinutes: 65,
    durationRange: '61–68 min',
    walkingDistanceMeters: 420,
    transfersCount: 1,
    crowding: 'moderate',
    shelteredPercentage: 92,
    isStepFree: true,
    hasWorkingLifts: true,
    isMostlySheltered: true,
  },
  departureTime: '8:38 AM',
  arrivalTime: '9:44–9:53 AM',
  departureLocation: 'Sky Eden @ Bedok',
  arrivalLocation: 'Singapore General Hospital (Clinic 4A)',
  summarySteps: [
    'Walk 320 m to Bedok MRT (Sheltered walkway)',
    'East West Line to Outram Park (Board Cars 3/4)',
    'Reroute via Concourse Lift L2 to Exit B (Avoids outage)',
    'Walk 100 m along covered barrier-free linkway to SGH Block 4',
  ],
  steps: MDM_LIM_RECOMMENDED_STEPS,
};
