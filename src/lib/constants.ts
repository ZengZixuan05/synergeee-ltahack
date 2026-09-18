export const APP_CONFIG = {
  name: 'GoAble SG',
  tagline: 'Smart Commuter Companion for Singapore',
  agencyName: 'Singapore Public Transport Companion',
  shortDescription: 'Personalised, proactive journey recommendations for Singapore commuters.',
  version: '0.1.0-prototype',
};

export const NAVIGATION_TABS = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    iconName: 'Home',
    badge: null,
  },
  {
    id: 'directions',
    label: 'Directions',
    href: '/directions',
    iconName: 'MapPin',
    badge: null,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    iconName: 'User',
    badge: null,
  },
] as const;

export const TEXT_SIZE_OPTIONS = [
  { id: 'standard', label: 'Standard', scaleClass: 'text-size-standard' },
  { id: 'large', label: 'Large', scaleClass: 'text-size-large' },
  { id: 'xlarge', label: 'Extra large', scaleClass: 'text-size-xlarge' },
] as const;
