/**
 * Wasil Constants - Uber-Style Configuration
 * Clean, modern branding for Juba, South Sudan
 */

// ============================================
// JUBA GEOGRAPHIC CONFIGURATION
// ============================================

export const JUBA_CENTER = {
  latitude: 4.8517,
  longitude: 31.5825,
};

export const JUBA_BOUNDS = {
  north: 4.92,
  south: 4.78,
  east: 31.68,
  west: 31.48,
};

export const MAX_SERVICE_RADIUS_KM = 15;
export const DEFAULT_DRIVER_SEARCH_RADIUS_KM = 3;

// ============================================
// CURRENCY - South Sudanese Pound
// ============================================

export const CURRENCY = {
  code: 'SSP',
  symbol: 'SSP',
  name: 'South Sudanese Pound',
  decimals: 0,
  exchangeRate: 1300, // 1 USD = ~1300 SSP
};

// ============================================
// RIDE TYPES - Uber-Style Naming
// ============================================

export const RIDE_TYPES = {
  boda_boda: {
    id: 'boda_boda',
    name: 'Wasil Boda',
    description: 'Motorcycle • Fast & affordable',
    icon: '🏍️',
    color: '#FF6B6B',
    multiplier: 0.7,
    maxPassengers: 1,
    baseFare: 300,
    perKm: 150,
    perMin: 20,
    minFare: 500,
  },
  standard: {
    id: 'standard',
    name: 'Wasil X',
    description: 'Affordable everyday rides',
    icon: '🚗',
    color: '#800020',  // Maroon
    multiplier: 1.0,
    maxPassengers: 4,
    baseFare: 500,
    perKm: 300,
    perMin: 50,
    minFare: 1000,
  },
  premium: {
    id: 'premium',
    name: 'Wasil Select',
    description: 'Premium rides with top drivers',
    icon: '🚙',
    color: '#C9A227',  // Gold
    multiplier: 1.5,
    maxPassengers: 4,
    baseFare: 800,
    perKm: 500,
    perMin: 80,
    minFare: 2000,
  },
};

// ============================================
// PAYMENT METHODS
// ============================================

export const PAYMENT_METHODS = {
  cash: {
    id: 'cash',
    name: 'Cash',
    icon: '💵',
    enabled: true,
    default: true,
  },
  mtn: {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: '📱',
    enabled: true,
    default: false,
  },
  zain: {
    id: 'zain',
    name: 'Zain Cash',
    icon: '📱',
    enabled: true,
    default: false,
  },
  card: {
    id: 'card',
    name: 'Card',
    icon: '💳',
    enabled: true,
    default: false,
  },
};

// ============================================
// RIDE STATUS
// ============================================

export const RIDE_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ============================================
// DRIVER STATUS
// ============================================

export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
};

// ============================================
// SURGE PRICING (Peak Hours)
// ============================================

export const SURGE_PRICING = {
  morning_rush: {
    hours: [7, 8, 9],
    multiplier: 1.3,
  },
  evening_rush: {
    hours: [17, 18, 19],
    multiplier: 1.3,
  },
  night: {
    hours: [22, 23, 0, 1, 2, 3, 4, 5],
    multiplier: 1.5,
    safetyFee: 500,
  },
  rainy_season: {
    months: [4, 5, 6, 7, 8, 9, 10],
    multiplier: 1.2,
  },
};

// ============================================
// CANCELLATION FEES
// ============================================

export const CANCELLATION = {
  freeWindowMinutes: 2,
  feeAfterAccepted: 500,
  feeAfterDriverArrived: 1000,
};

// ============================================
// JUBA LANDMARKS (Popular Destinations)
// ============================================

export const JUBA_LANDMARKS = [
  { name: 'Juba International Airport', lat: 4.8720, lng: 31.6011, icon: '✈️' },
  { name: 'Konyo Konyo Market', lat: 4.8503, lng: 31.5897, icon: '🛒' },
  { name: 'Juba Teaching Hospital', lat: 4.8441, lng: 31.5819, icon: '🏥' },
  { name: 'University of Juba', lat: 4.8622, lng: 31.5711, icon: '🎓' },
  { name: 'Juba Stadium', lat: 4.8492, lng: 31.5994, icon: '🏟️' },
  { name: 'Custom Market', lat: 4.8551, lng: 31.5828, icon: '🏪' },
  { name: 'Afex River Camp', lat: 4.8694, lng: 31.6125, icon: '🏕️' },
  { name: 'Nyakuron Cultural Centre', lat: 4.8581, lng: 31.5906, icon: '🎭' },
];

// ============================================
// JUBA ZONES
// ============================================

export const JUBA_ZONES = {
  center: {
    name: 'Juba Town',
    areas: ['Konyo Konyo', 'Custom Market', 'Ministries'],
    multiplier: 1.0,
  },
  residential: {
    name: 'Residential',
    areas: ['Munuki', 'Gudele', 'Hai Referendum', 'Kator', 'Jebel'],
    multiplier: 1.1,
  },
  outer: {
    name: 'Outer Juba',
    areas: ['Bilpam', 'Lologo', 'Suk Sita'],
    multiplier: 1.3,
  },
};

// ============================================
// EMERGENCY CONTACTS
// ============================================

export const EMERGENCY_CONTACTS = {
  police: '777',
  ambulance: '997',
  fire: '998',
  wasil_support: '+211920000000',
};

// ============================================
// SAFETY FEATURES
// ============================================

export const SAFETY_FEATURES = {
  shareTrip: true,
  sosButton: true,
  driverVerification: true,
  rideRecording: false,
  minDriverRating: 4.0,
};

// ============================================
// LANGUAGES
// ============================================

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
  name: 'Wasil',
  tagline: 'Your ride, your way',
  version: '1.0.0',
  supportEmail: 'support@wasil.com',
  supportPhone: '+211920000000',
  website: 'https://wasil.com',
  socialMedia: {
    facebook: 'wasilapp',
    twitter: 'wasilapp',
    instagram: 'wasilapp',
  },
};

// ============================================
// MAP CONFIGURATION
// ============================================

export const MAP_CONFIG = {
  defaultZoom: 15,
  minZoom: 10,
  maxZoom: 20,
  animationDuration: 500,
  markerAnchor: { x: 0.5, y: 1 },
  // Map style (Uber-like clean style)
  style: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// ============================================
// SOCKET EVENTS
// ============================================

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Rider events
  REQUEST_RIDE: 'request-ride',
  CANCEL_RIDE: 'cancel-ride',
  
  // Driver events
  DRIVER_LOCATION_UPDATE: 'driver-location-update',
  ACCEPT_RIDE: 'accept-ride',
  DECLINE_RIDE: 'decline-ride',
  START_RIDE: 'start-ride',
  COMPLETE_RIDE: 'complete-ride',
  
  // Notifications
  RIDE_REQUESTED: 'ride-requested',
  RIDE_ACCEPTED: 'ride-accepted',
  DRIVER_ARRIVED: 'driver-arrived',
  RIDE_STARTED: 'ride-started',
  RIDE_COMPLETED: 'ride-completed',
  RIDE_CANCELLED: 'ride-cancelled',
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  JUBA_CENTER,
  JUBA_BOUNDS,
  MAX_SERVICE_RADIUS_KM,
  DEFAULT_DRIVER_SEARCH_RADIUS_KM,
  CURRENCY,
  RIDE_TYPES,
  PAYMENT_METHODS,
  RIDE_STATUS,
  DRIVER_STATUS,
  SURGE_PRICING,
  CANCELLATION,
  JUBA_LANDMARKS,
  JUBA_ZONES,
  EMERGENCY_CONTACTS,
  SAFETY_FEATURES,
  LANGUAGES,
  APP_CONFIG,
  MAP_CONFIG,
  SOCKET_EVENTS,
};
