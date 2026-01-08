/**
 * Tracking Routes
 * 
 * Defines all driver location and tracking API endpoints.
 * 
 * @module routes/tracking.routes
 */

const express = require('express');
const router = express.Router();
const TrackingController = require('../controllers/tracking.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize, driverOnly, adminOnly } = require('../middleware/authorize');
const { 
  validateLocationUpdate, 
  validateAvailability,
  validateNearbyDrivers,
  sanitizeInput
} = require('../middleware/validate');

// Apply sanitization to all routes
router.use(sanitizeInput);

// All routes require authentication
router.use(authenticate);

// ==========================================
// DRIVER LOCATION ENDPOINTS
// ==========================================

/**
 * @route   PUT /api/v1/drivers/location
 * @desc    Update driver's current location
 * @access  Driver only
 */
router.put(
  '/location',
  authorize('driver'),
  validateLocationUpdate,
  TrackingController.updateDriverLocation
);

/**
 * @route   GET /api/v1/drivers/:id/location
 * @desc    Get driver's location (for riders tracking their driver)
 * @access  Authenticated users (with restrictions)
 */
router.get(
  '/:id/location',
  TrackingController.getDriverLocation
);

// ==========================================
// DRIVER AVAILABILITY ENDPOINTS
// ==========================================

/**
 * @route   PUT /api/v1/drivers/availability
 * @desc    Toggle driver availability status
 * @access  Driver only
 */
router.put(
  '/availability',
  authorize('driver'),
  validateAvailability,
  TrackingController.toggleAvailability
);

/**
 * @route   GET /api/v1/drivers/availability
 * @desc    Get driver's availability status
 * @access  Driver only
 */
router.get(
  '/availability',
  authorize('driver'),
  TrackingController.getAvailability
);

// ==========================================
// DRIVER ONLINE/OFFLINE ENDPOINTS
// ==========================================

/**
 * @route   POST /api/v1/drivers/online
 * @desc    Go online and start accepting rides
 * @access  Driver only
 */
router.post(
  '/online',
  authorize('driver'),
  validateLocationUpdate,
  TrackingController.goOnline
);

/**
 * @route   POST /api/v1/drivers/offline
 * @desc    Go offline and stop accepting rides
 * @access  Driver only
 */
router.post(
  '/offline',
  authorize('driver'),
  TrackingController.goOffline
);

// ==========================================
// NEARBY DRIVERS ENDPOINTS
// ==========================================

/**
 * @route   GET /api/v1/drivers/nearby
 * @desc    Find nearby available drivers
 * @access  Admin or internal use
 */
router.get(
  '/nearby',
  authorize('admin', 'rider'),
  validateNearbyDrivers,
  TrackingController.getNearbyDrivers
);

/**
 * @route   GET /api/v1/drivers/stats
 * @desc    Get statistics for nearby drivers
 * @access  Admin or internal use
 */
router.get(
  '/stats',
  authorize('admin', 'rider'),
  validateNearbyDrivers,
  TrackingController.getNearbyDriverStats
);

module.exports = router;
