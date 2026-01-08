/**
 * Ride Routes
 * 
 * Defines all ride-related API endpoints.
 * 
 * @module routes/ride.routes
 */

const express = require('express');
const router = express.Router();
const RideController = require('../controllers/ride.controller');
const TrackingController = require('../controllers/tracking.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize, driverOnly, riderOnly } = require('../middleware/authorize');
const { 
  validateRequestRide, 
  validateRating, 
  validateCancellation,
  validatePagination,
  validateLocationUpdate,
  validateDifferentLocations,
  sanitizeInput
} = require('../middleware/validate');

// Apply sanitization to all routes
router.use(sanitizeInput);

// All routes require authentication
router.use(authenticate);

// ==========================================
// RIDE ENDPOINTS
// ==========================================

/**
 * @route   POST /api/v1/rides
 * @desc    Request a new ride
 * @access  Rider only
 */
router.post(
  '/',
  authorize('rider'),
  validateRequestRide,
  validateDifferentLocations,
  RideController.requestRide
);

/**
 * @route   GET /api/v1/rides
 * @desc    Get ride history for authenticated user
 * @access  Authenticated users
 */
router.get(
  '/',
  validatePagination,
  RideController.getRideHistory
);

/**
 * @route   POST /api/v1/rides/estimate
 * @desc    Get fare estimate for a route
 * @access  Authenticated users
 */
router.post(
  '/estimate',
  validateRequestRide,
  RideController.getFareEstimate
);

/**
 * @route   GET /api/v1/rides/active/rider
 * @desc    Get rider's active ride
 * @access  Rider only
 */
router.get(
  '/active/rider',
  authorize('rider'),
  RideController.getActiveRiderRide
);

/**
 * @route   GET /api/v1/rides/active/driver
 * @desc    Get driver's active ride
 * @access  Driver only
 */
router.get(
  '/active/driver',
  authorize('driver'),
  RideController.getActiveDriverRide
);

/**
 * @route   GET /api/v1/rides/:id
 * @desc    Get ride details by ID
 * @access  Ride participants only
 */
router.get(
  '/:id',
  RideController.getRide
);

/**
 * @route   POST /api/v1/rides/:id/accept
 * @desc    Accept a ride request
 * @access  Driver only
 */
router.post(
  '/:id/accept',
  authorize('driver'),
  RideController.acceptRide
);

/**
 * @route   POST /api/v1/rides/:id/decline
 * @desc    Decline a ride request
 * @access  Driver only
 */
router.post(
  '/:id/decline',
  authorize('driver'),
  RideController.declineRide
);

/**
 * @route   POST /api/v1/rides/:id/arrive
 * @desc    Mark driver as arrived at pickup
 * @access  Driver only
 */
router.post(
  '/:id/arrive',
  authorize('driver'),
  RideController.arriveAtPickup
);

/**
 * @route   POST /api/v1/rides/:id/start
 * @desc    Start the ride
 * @access  Driver only
 */
router.post(
  '/:id/start',
  authorize('driver'),
  RideController.startRide
);

/**
 * @route   POST /api/v1/rides/:id/complete
 * @desc    Complete the ride
 * @access  Driver only
 */
router.post(
  '/:id/complete',
  authorize('driver'),
  RideController.completeRide
);

/**
 * @route   POST /api/v1/rides/:id/cancel
 * @desc    Cancel a ride
 * @access  Ride participants only
 */
router.post(
  '/:id/cancel',
  validateCancellation,
  RideController.cancelRide
);

/**
 * @route   POST /api/v1/rides/:id/rate
 * @desc    Rate a completed ride
 * @access  Ride participants only
 */
router.post(
  '/:id/rate',
  validateRating,
  RideController.rateRide
);

/**
 * @route   PUT /api/v1/rides/:id/location
 * @desc    Update location during ride
 * @access  Driver only
 */
router.put(
  '/:id/location',
  authorize('driver'),
  validateLocationUpdate,
  TrackingController.updateRideLocation
);

/**
 * @route   GET /api/v1/rides/:id/tracking
 * @desc    Get ride location history
 * @access  Ride participants only
 */
router.get(
  '/:id/tracking',
  TrackingController.getRideTracking
);

/**
 * @route   GET /api/v1/rides/:id/eta
 * @desc    Get ETA for ride
 * @access  Ride participants only
 */
router.get(
  '/:id/eta',
  TrackingController.getRideETA
);

module.exports = router;
