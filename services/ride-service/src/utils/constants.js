/**
 * Application Constants
 * 
 * Central location for all constant values used throughout
 * the Ride Service application.
 * 
 * Customized for Wasil - Juba, South Sudan
 * 
 * @module utils/constants
 */

/**
 * Ride Status Constants
 * Defines all possible states a ride can be in
 */
const RIDE_STATUS = {
  REQUESTED: 'requested',     // Rider has requested a ride
  ACCEPTED: 'accepted',       // Driver has accepted the ride
  ARRIVING: 'arriving',       // Driver is on the way to pickup
  IN_PROGRESS: 'in_progress', // Ride is currently in progress
  COMPLETED: 'completed',     // Ride has been completed
  CANCELLED: 'cancelled'      // Ride was cancelled
};

/**
 * Valid status transitions
 * Maps current status to allowed next statuses
 */
const VALID_STATUS_TRANSITIONS = {
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.ACCEPTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.ACCEPTED]: [RIDE_STATUS.ARRIVING, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.ARRIVING]: [RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.IN_PROGRESS]: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: []
};

/**
 * Ride Types
 * Different categories of rides offered
 * Updated for Juba, South Sudan market
 */
const RIDE_TYPES = {
  BODA_BODA: 'boda_boda', // Motorcycle taxi - Most popular in Juba
  STANDARD: 'standard',    // Regular sedan (Toyota Corolla, Noah, Wish)
  PREMIUM: 'premium'       // Premium/luxury vehicle (Land Cruiser, Prado, V8)
};

/**
 * Ride Type Configuration for Juba
 * Includes multipliers and vehicle details
 */
const RIDE_TYPE_CONFIG = {
  [RIDE_TYPES.BODA_BODA]: {
    name: 'Boda Boda',
    description: 'Motorcycle taxi - Fast & Affordable',
    multiplier: 0.7,
    maxPassengers: 1,
    icon: '🏍️',
    brands: ['Bajaj', 'TVS', 'Honda'],
    fuelType: 'petrol'
  },
  [RIDE_TYPES.STANDARD]: {
    name: 'Standard Car',
    description: 'Comfortable sedan',
    multiplier: 1.0,
    maxPassengers: 4,
    icon: '🚗',
    brands: ['Toyota Corolla', 'Noah', 'Wish'],
    fuelType: 'petrol'
  },
  [RIDE_TYPES.PREMIUM]: {
    name: 'Premium',
    description: 'Luxury vehicle with AC',
    multiplier: 1.5,
    maxPassengers: 4,
    icon: '🚙',
    brands: ['Land Cruiser', 'Prado', 'V8'],
    fuelType: 'diesel',
    features: ['AC', 'leather_seats']
  }
};

/**
 * Ride Type Multipliers (Legacy support)
 * Price multipliers for different ride types
 */
const RIDE_TYPE_MULTIPLIERS = {
  [RIDE_TYPES.BODA_BODA]: 0.7,
  [RIDE_TYPES.STANDARD]: 1.0,
  [RIDE_TYPES.PREMIUM]: 1.5
};

/**
 * Currency Configuration for South Sudan
 * SSP = South Sudanese Pound
 * Exchange Rate (Dec 2024): ~1 USD = 1,300 SSP
 */
const CURRENCY_CONFIG = {
  CODE: process.env.CURRENCY || 'SSP',
  SYMBOL: process.env.CURRENCY_SYMBOL || 'SSP',
  USD_RATE: parseFloat(process.env.USD_TO_SSP_RATE) || 1300,
  DECIMALS: 0  // No decimal places for SSP
};

/**
 * Fare Configuration for Juba, South Sudan
 * All values in South Sudanese Pound (SSP)
 * Default pricing values (can be overridden by environment variables)
 */
const FARE_CONFIG = {
  // Base fares (in SSP)
  BASE_FARE: parseFloat(process.env.BASE_FARE) || 500,         // ~$0.38 USD
  MINIMUM_FARE: parseFloat(process.env.MINIMUM_FARE) || 1000,  // ~$0.77 USD
  
  // Per distance (SSP per km)
  COST_PER_KM: {
    [RIDE_TYPES.BODA_BODA]: parseFloat(process.env.COST_PER_KM_BODA) || 200,  // ~$0.15/km
    [RIDE_TYPES.STANDARD]: parseFloat(process.env.COST_PER_KM_STANDARD) || 300, // ~$0.23/km
    [RIDE_TYPES.PREMIUM]: parseFloat(process.env.COST_PER_KM_PREMIUM) || 500    // ~$0.38/km
  },
  
  // Per time (SSP per minute)
  COST_PER_MINUTE: {
    [RIDE_TYPES.BODA_BODA]: parseFloat(process.env.COST_PER_MIN_BODA) || 30,    // ~$0.02/min
    [RIDE_TYPES.STANDARD]: parseFloat(process.env.COST_PER_MIN_STANDARD) || 50, // ~$0.04/min
    [RIDE_TYPES.PREMIUM]: parseFloat(process.env.COST_PER_MIN_PREMIUM) || 80    // ~$0.06/min
  },
  
  // Legacy support (for existing code)
  COST_PER_MILE: parseFloat(process.env.COST_PER_MILE) || 480,  // ~300 SSP/km * 1.6 = 480 SSP/mile
  
  // Surge pricing
  DEFAULT_SURGE_MULTIPLIER: parseFloat(process.env.DEFAULT_SURGE_MULTIPLIER) || 1.0,
  MAX_SURGE_MULTIPLIER: 3.0,
  
  // Fees
  BOOKING_FEE: parseFloat(process.env.BOOKING_FEE) || 100,
  CANCELLATION_FEE: parseFloat(process.env.CANCELLATION_FEE) || 500,
  
  // Night safety fee (10pm - 5am)
  NIGHT_SAFETY_FEE: parseFloat(process.env.NIGHT_SAFETY_FEE) || 500,
  
  // Waiting fee
  WAITING_FEE_PER_MINUTE: parseFloat(process.env.WAITING_FEE) || 50,
  WAITING_GRACE_PERIOD_MINUTES: 5
};

/**
 * Surge Pricing Times for Juba
 * Peak hours when surge pricing is applied
 */
const SURGE_TIMES = {
  MORNING_RUSH: {
    hours: [7, 8, 9],  // 7am - 9am
    multiplier: 1.3
  },
  EVENING_RUSH: {
    hours: [17, 18, 19],  // 5pm - 7pm
    multiplier: 1.3
  },
  NIGHT: {
    hours: [22, 23, 0, 1, 2, 3, 4, 5],  // 10pm - 5am
    multiplier: 1.5,
    safetyFee: 500  // Additional safety fee
  }
};

/**
 * Road Conditions for Juba
 * Affects fare calculation and ETA
 */
const ROAD_CONDITIONS = {
  PAVED: {
    type: 'paved',
    multiplier: 1.0,
    avgSpeedKmh: 40
  },
  UNPAVED: {
    type: 'unpaved',
    multiplier: 1.2,  // Higher wear & tear
    avgSpeedKmh: 25
  },
  RAINY_SEASON: {
    type: 'rainy_season',
    multiplier: 1.5,  // Poor road conditions during rain
    avgSpeedKmh: 20,
    months: [4, 5, 6, 7, 8, 9, 10]  // April - October
  }
};

/**
 * Driver Search Configuration
 */
const DRIVER_SEARCH = {
  MAX_RADIUS_MILES: parseInt(process.env.MAX_DRIVER_SEARCH_RADIUS, 10) || 5,
  MAX_DRIVERS_TO_NOTIFY: parseInt(process.env.MAX_DRIVERS_TO_NOTIFY, 10) || 5,
  SEARCH_TIMEOUT_MS: parseInt(process.env.MAX_DRIVER_WAIT_TIME, 10) || 300000, // 5 minutes
  REQUEST_EXPIRY_SECONDS: 30,  // Time for driver to respond
  MIN_DRIVER_RATING: 4.0       // Minimum rating to receive requests
};

/**
 * Rating Configuration
 */
const RATING_CONFIG = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  DEFAULT_RATING: 5.0,
  LOW_RATING_THRESHOLD: 3  // Below this triggers review
};

/**
 * Cancellation Configuration
 */
const CANCELLATION = {
  CANCELLED_BY: {
    RIDER: 'rider',
    DRIVER: 'driver',
    SYSTEM: 'system'
  },
  FREE_CANCELLATION_WINDOW_SECONDS: 120,  // 2 minutes free cancellation
  REASONS: [
    'changed_my_mind',
    'driver_too_far',
    'found_other_ride',
    'driver_not_responding',
    'incorrect_pickup_location',
    'rider_not_responding',
    'rider_no_show',
    'safety_concern',
    'vehicle_issue',
    'other'
  ]
};

/**
 * Ride Request Status
 * Status of individual ride requests sent to drivers
 */
const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  TAKEN: 'taken'  // Another driver accepted first
};

/**
 * Location Update Configuration
 */
const LOCATION_CONFIG = {
  UPDATE_INTERVAL_MS: 5000,           // How often to send location updates
  STALE_LOCATION_THRESHOLD_MS: 30000, // When to consider location data stale
  MIN_DISTANCE_FOR_UPDATE: 0.01       // Minimum movement (miles) to trigger update
};

/**
 * Redis Key Prefixes
 */
const REDIS_KEYS = {
  DRIVER_LOCATION: 'driver:location:',
  DRIVER_AVAILABILITY: 'driver:available:',
  ACTIVE_RIDE: 'ride:active:',
  RIDE_REQUESTS: 'ride:requests:',
  SURGE_ZONE: 'surge:zone:'
};

/**
 * RabbitMQ Queue Names
 */
const QUEUES = {
  RIDE_REQUESTED: 'ride.requested',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_CANCELLED: 'ride.cancelled',
  NOTIFICATION_PUSH: 'notification.push',
  NOTIFICATION_SMS: 'notification.sms',
  NOTIFICATION_EMAIL: 'notification.email'
};

/**
 * RabbitMQ Exchange Names
 */
const EXCHANGES = {
  RIDES: 'rides',
  NOTIFICATIONS: 'notifications'
};

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Error Codes
 * Custom error codes for the application
 */
const ERROR_CODES = {
  // Ride errors
  RIDE_NOT_FOUND: 'RIDE_NOT_FOUND',
  RIDE_ALREADY_ACTIVE: 'RIDE_ALREADY_ACTIVE',
  INVALID_RIDE_STATUS: 'INVALID_RIDE_STATUS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  RIDE_ALREADY_ACCEPTED: 'RIDE_ALREADY_ACCEPTED',
  
  // Driver errors
  DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  DRIVER_ALREADY_ASSIGNED: 'DRIVER_ALREADY_ASSIGNED',
  NO_DRIVERS_AVAILABLE: 'NO_DRIVERS_AVAILABLE',
  
  // Rider errors
  RIDER_NOT_FOUND: 'RIDER_NOT_FOUND',
  RIDER_HAS_ACTIVE_RIDE: 'RIDER_HAS_ACTIVE_RIDE',
  
  // Location errors
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  LOCATION_UPDATE_FAILED: 'LOCATION_UPDATE_FAILED',
  
  // Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * User Roles
 */
const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

/**
 * Average Speeds for ETA Calculation (mph)
 */
const AVERAGE_SPEEDS = {
  CITY: 25,
  HIGHWAY: 55,
  RURAL: 45,
  TRAFFIC: 15
};

/**
 * Pagination Defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

/**
 * Juba Geographic Configuration
 * Boundaries and zones for the service area
 */
const JUBA_GEO = {
  CENTER: {
    latitude: 4.8517,
    longitude: 31.5825
  },
  MAX_SERVICE_RADIUS_KM: parseFloat(process.env.MAX_SERVICE_RADIUS_KM) || 15,
  DEFAULT_DRIVER_SEARCH_RADIUS_KM: parseFloat(process.env.DEFAULT_DRIVER_SEARCH_RADIUS_KM) || 3,
  
  // Operating zones
  ZONES: {
    CENTER: {
      name: 'Juba Town Center',
      coordinates: { lat: 4.8517, lng: 31.5825 },
      radius: 3,  // km
      baseFareMultiplier: 1.0,
      areas: [
        'Konyo Konyo Market',
        'Juba Airport',
        'Juba Teaching Hospital',
        'University of Juba',
        'Ministries Area'
      ]
    },
    RESIDENTIAL: {
      name: 'Residential Areas',
      baseFareMultiplier: 1.1,
      areas: [
        'Munuki',
        'Gudele',
        'Hai Referendum',
        'Hai Cinema',
        'Hai Thoura',
        'Hai Jalaba',
        'Kator',
        'Jebel'
      ]
    },
    OUTER: {
      name: 'Outer Juba',
      baseFareMultiplier: 1.3,
      areas: [
        'Bilpam',
        'Lologo',
        'Suk Sita (New Site)',
        'Hai Mauna',
        'Hai Malakal'
      ]
    }
  },
  
  // Popular landmarks for easy destination selection
  LANDMARKS: [
    { name: 'Juba International Airport', lat: 4.8720, lng: 31.6011 },
    { name: 'Konyo Konyo Market', lat: 4.8503, lng: 31.5897 },
    { name: 'Juba Teaching Hospital', lat: 4.8441, lng: 31.5819 },
    { name: 'University of Juba', lat: 4.8622, lng: 31.5711 },
    { name: 'Juba Stadium', lat: 4.8492, lng: 31.5994 },
    { name: 'Custom Market', lat: 4.8551, lng: 31.5828 },
    { name: 'Afex River Camp', lat: 4.8694, lng: 31.6125 },
    { name: 'Nyakuron Cultural Centre', lat: 4.8581, lng: 31.5906 }
  ]
};

/**
 * Payment Methods Configuration for South Sudan
 */
const PAYMENT_METHODS = {
  CASH: {
    code: 'cash',
    name: 'Cash',
    enabled: true,
    default: true,
    icon: '💵',
    currency: 'SSP'
  },
  MTN_MOBILE_MONEY: {
    code: 'mtn_ss',
    name: 'MTN Mobile Money',
    enabled: true,
    icon: '📱',
    phonePrefix: '+211'
  },
  ZAIN_CASH: {
    code: 'zain_ss',
    name: 'Zain Cash',
    enabled: true,
    icon: '📱',
    phonePrefix: '+211'
  },
  CARD: {
    code: 'card',
    name: 'Credit/Debit Card',
    enabled: true,
    icon: '💳',
    note: 'International cards accepted'
  }
};

/**
 * Safety Features Configuration for Juba
 */
const SAFETY_CONFIG = {
  // Emergency contacts
  EMERGENCY: {
    POLICE: '777',
    AMBULANCE: '997',
    FIRE: '998'
  },
  
  // Safety zones (UN compounds, embassies)
  SAFE_ZONES: [
    { name: 'UNMISS HQ', lat: 4.8598, lng: 31.5825 },
    { name: 'US Embassy', lat: 4.8672, lng: 31.6014 },
    { name: 'UK Embassy', lat: 4.8653, lng: 31.5942 }
  ],
  
  // Night travel restrictions
  NIGHT_TRAVEL: {
    enabled: true,
    curfewStart: '23:00',
    curfewEnd: '05:00',
    requiresVerification: true,
    additionalFee: 1000  // SSP
  },
  
  // Driver verification requirements
  DRIVER_VERIFICATION: {
    requiresNationalID: true,
    requiresDrivingLicense: true,
    requiresPoliceCheck: true,
    requiresVehicleInspection: true,
    photoRequired: true
  },
  
  // In-app safety features
  IN_APP_SAFETY: {
    shareRideWithContacts: true,
    sosButton: true,
    audioRecording: true,
    driverRatingMinimum: 4.0,
    riderRatingMinimum: 3.5
  }
};

/**
 * Supported Languages for Juba
 */
const SUPPORTED_LANGUAGES = {
  EN: { code: 'en', name: 'English', native: 'English', default: true },
  AR: { code: 'ar', name: 'Arabic (Juba)', native: 'العربية', rtl: true },
  DIN: { code: 'din', name: 'Dinka', native: 'Thuɔŋjäŋ' },
  NUE: { code: 'nue', name: 'Nuer', native: 'Naath' },
  BRI: { code: 'bri', name: 'Bari', native: 'Bari' }
};

/**
 * Operating Hours Configuration
 */
const OPERATING_HOURS = {
  STANDARD: {
    start: '05:00',
    end: '23:00'
  },
  NIGHT_SERVICE: {
    enabled: true,
    start: '23:00',
    end: '05:00',
    multiplier: 1.5,
    verificationRequired: true
  },
  CURFEW: {
    enabled: false,  // Update based on current situation
    start: '00:00',
    end: '05:00'
  }
};

/**
 * Notification Configuration
 * SMS is prioritized for reliability in Juba
 */
const NOTIFICATION_CONFIG = {
  SMS: {
    enabled: true,
    priority: 'high',
    provider: 'africastalking'
  },
  WHATSAPP: {
    enabled: true,
    priority: 'medium'
  },
  PUSH: {
    enabled: true,
    priority: 'low'  // Unreliable network
  }
};

module.exports = {
  // Ride configuration
  RIDE_STATUS,
  VALID_STATUS_TRANSITIONS,
  RIDE_TYPES,
  RIDE_TYPE_CONFIG,
  RIDE_TYPE_MULTIPLIERS,
  
  // Pricing
  CURRENCY_CONFIG,
  FARE_CONFIG,
  SURGE_TIMES,
  ROAD_CONDITIONS,
  
  // Driver configuration
  DRIVER_SEARCH,
  
  // Rating & Cancellation
  RATING_CONFIG,
  CANCELLATION,
  REQUEST_STATUS,
  
  // Location
  LOCATION_CONFIG,
  JUBA_GEO,
  
  // Payment
  PAYMENT_METHODS,
  
  // Safety
  SAFETY_CONFIG,
  
  // Languages
  SUPPORTED_LANGUAGES,
  
  // Operations
  OPERATING_HOURS,
  NOTIFICATION_CONFIG,
  
  // Infrastructure
  REDIS_KEYS,
  QUEUES,
  EXCHANGES,
  
  // HTTP & Errors
  HTTP_STATUS,
  ERROR_CODES,
  
  // User
  USER_ROLES,
  
  // Misc
  AVERAGE_SPEEDS,
  PAGINATION
};
