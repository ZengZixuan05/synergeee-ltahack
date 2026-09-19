import { Journey } from '@/types';
import { SAMPLE_USUAL_ROUTE, SAMPLE_AFFECTED_ROUTE, SAMPLE_RECOMMENDED_ROUTE } from './routes';

export const MDM_LIM_SGH_JOURNEY: Journey = {
  id: 'journey-sgh-appointment',
  title: 'SGH Appointment',
  recurrence: 'Monday · Every alternate week',
  targetArrivalTime: '10:00 AM',
  originName: 'Sky Eden @ Bedok',
  destinationName: 'Singapore General Hospital (SGH)',
  isAffected: false,
  normalRoute: SAMPLE_USUAL_ROUTE,
  affectedRoute: SAMPLE_AFFECTED_ROUTE,
  recommendedRoute: SAMPLE_RECOMMENDED_ROUTE,
};

export const MDM_LIM_SGH_AFFECTED_JOURNEY: Journey = {
  ...MDM_LIM_SGH_JOURNEY,
  isAffected: true,
  affectedReason: 'The lift used by your usual route is unavailable.',
  affectedDetail: 'Outram Park MRT Exit A lift is out of service for unscheduled repair.',
  recommendedAction: 'Recommended: Use the accessible alternative route via Exit B and leave 7 minutes earlier.',
  normalRoute: SAMPLE_USUAL_ROUTE,
  affectedRoute: SAMPLE_AFFECTED_ROUTE,
  recommendedRoute: SAMPLE_RECOMMENDED_ROUTE,
};
