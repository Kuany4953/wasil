/**
 * Tracking Controller
 * 
 * Handles location tracking and driver availability endpoints.
 * 
 * @module controllers/tracking.controller
 */

const LocationService = require('../services/locationService');
const MatchingService = require('../services/matchingService');
const Ride = require('../models/Ride');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES, RIDE_STATUS } = require('../utils/constants');

class TrackingController {
  /**
   * Update driver location
   * PUT /api/v1/drivers/location
   */
  static updateDriverLocation = asyncHandler(async (req, res) => {
    const driverId = req.user.id;
    const { latitude, longitude, heading, speed } = req.body;

    const location = await LocationService.updateDriverLocation(driverId, {
      latitude,
      longitude,
      heading,
      speed
    });

    // If driver has an active ride, update ride tracking too
    const activeRide = await Ride.findActiveByDriver(driverId);
    if (activeRide) {
      await LocationService.updateRideLocation(activeRide.id, driverId, {
        latitude,
        longitude,
        heading,
        speed
      });
    }

    res.json({
      success: true,
      data: { location }
    });
  });

  /**
   * Update location during a ride
   * PUT /api/v1/rides/:id/location
   */
  static updateRideLocation = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;
    const { latitude, longitude, heading, speed } = req.body;

    // Verify ride exists and driver is assigned
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw AppError.forbidden('You are not the driver for this ride');
    }

    // Only allow location updates for active rides
    const activeStatuses = [RIDE_STATUS.ACCEPTED, RIDE_STATUS.ARRIVING, RIDE_STATUS.IN_PROGRESS];
    if (!activeStatuses.includes(ride.status)) {
      throw new AppError(
        'Cannot update location for this ride status',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_RIDE_STATUS
      );
    }

    // Update location
    await LocationService.updateRideLocation(rideId, driverId, {
      latitude,
      longitude,
      heading,
      speed
    });

    // Calculate ETA to destination
    const destination = ride.status === RIDE_STATUS.IN_PROGRESS 
      ? ride.dropoff 
      : ride.pickup;
    
    const eta = LocationService.calculateETA(
      { latitude, longitude },
      destination
    );

    res.json({
      success: true,
      data: {
        location: { latitude, longitude, heading, speed },
        eta
      }
    });
  });

  /**
   * Toggle driver availability
   * PUT /api/v1/drivers/availability
   */
  static toggleAvailability = asyncHandler(async (req, res) => {
    const driverId = req.user.id;
    const { isAvailable } = req.body;

    // Check if driver has an active ride
    const activeRide = await Ride.findActiveByDriver(driverId);
    
    if (activeRide && isAvailable) {
      throw new AppError(
        'Cannot go available while on an active ride',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DRIVER_ALREADY_ASSIGNED
      );
    }

    await LocationService.setDriverAvailability(driverId, isAvailable);

    res.json({
      success: true,
      message: `Driver is now ${isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable }
    });
  });

  /**
   * Get driver's current availability status
   * GET /api/v1/drivers/availability
   */
  static getAvailability = asyncHandler(async (req, res) => {
    const driverId = req.user.id;

    const isAvailable = await LocationService.getDriverAvailability(driverId);
    const activeRide = await Ride.findActiveByDriver(driverId);

    res.json({
      success: true,
      data: {
        isAvailable,
        hasActiveRide: !!activeRide,
        activeRideId: activeRide?.id || null
      }
    });
  });

  /**
   * Find nearby available drivers
   * GET /api/v1/drivers/nearby
   */
  static getNearbyDrivers = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 5, limit = 10 } = req.query;

    const drivers = await MatchingService.findNearbyDrivers(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius),
      parseInt(limit, 10)
    );

    res.json({
      success: true,
      data: {
        count: drivers.length,
        drivers: drivers.map(d => ({
          driverId: d.driverId,
          distance: d.distanceToPickup,
          eta: d.etaSeconds
        }))
      }
    });
  });

  /**
   * Get driver's current location
   * GET /api/v1/drivers/:id/location
   */
  static getDriverLocation = asyncHandler(async (req, res) => {
    const driverId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Check authorization - only rider on active ride or the driver themselves
    if (userId !== driverId) {
      // Check if requester is a rider with this driver
      const activeRide = await Ride.findActiveByRider(userId);
      
      if (!activeRide || activeRide.driverId !== driverId) {
        throw AppError.forbidden('You cannot view this driver\'s location');
      }
    }

    const location = await LocationService.getDriverLocation(driverId);

    if (!location) {
      throw AppError.notFound('Driver location not found');
    }

    res.json({
      success: true,
      data: {
        location,
        isStale: LocationService.isLocationStale(location.updatedAt)
      }
    });
  });

  /**
   * Get location history for a ride
   * GET /api/v1/rides/:id/tracking
   */
  static getRideTracking = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Verify ride exists
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    // Verify user is involved
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw AppError.forbidden('You do not have access to this ride');
    }

    const history = await LocationService.getRideLocationHistory(rideId);

    res.json({
      success: true,
      data: {
        rideId,
        locations: history,
        count: history.length
      }
    });
  });

  /**
   * Get ETA for a ride
   * GET /api/v1/rides/:id/eta
   */
  static getRideETA = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Verify ride exists
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    // Verify user is involved
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw AppError.forbidden('You do not have access to this ride');
    }

    // Can only get ETA for active rides with a driver
    if (!ride.driverId) {
      return res.json({
        success: true,
        data: { eta: null, message: 'Waiting for driver' }
      });
    }

    const driverLocation = await LocationService.getDriverLocation(ride.driverId);
    
    if (!driverLocation) {
      return res.json({
        success: true,
        data: { eta: null, message: 'Driver location unavailable' }
      });
    }

    // Determine destination based on ride status
    const destination = ride.status === RIDE_STATUS.IN_PROGRESS 
      ? ride.dropoff 
      : ride.pickup;

    const eta = LocationService.calculateETA(driverLocation, destination);

    res.json({
      success: true,
      data: {
        eta,
        destination: ride.status === RIDE_STATUS.IN_PROGRESS ? 'dropoff' : 'pickup',
        driverLocation: {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude
        }
      }
    });
  });

  /**
   * Get nearby driver statistics for a location
   * GET /api/v1/drivers/stats
   */
  static getNearbyDriverStats = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 5 } = req.query;

    const stats = await LocationService.getNearbyDriverStats(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Go online (driver)
   * POST /api/v1/drivers/online
   */
  static goOnline = asyncHandler(async (req, res) => {
    const driverId = req.user.id;
    const { latitude, longitude } = req.body;

    // Update driver location and set online
    await LocationService.updateDriverLocation(driverId, { latitude, longitude });
    await LocationService.setDriverAvailability(driverId, true);

    logger.info('Driver went online', { driverId });

    res.json({
      success: true,
      message: 'You are now online and available for rides',
      data: {
        isOnline: true,
        isAvailable: true
      }
    });
  });

  /**
   * Go offline (driver)
   * POST /api/v1/drivers/offline
   */
  static goOffline = asyncHandler(async (req, res) => {
    const driverId = req.user.id;

    // Check for active ride
    const activeRide = await Ride.findActiveByDriver(driverId);
    
    if (activeRide) {
      throw new AppError(
        'Cannot go offline while on an active ride',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DRIVER_ALREADY_ASSIGNED
      );
    }

    // Set driver as unavailable
    await LocationService.setDriverAvailability(driverId, false);

    // Update MongoDB record
    const Location = require('../models/Location');
    await Location.setDriverOnlineStatus(driverId, false);

    logger.info('Driver went offline', { driverId });

    res.json({
      success: true,
      message: 'You are now offline',
      data: {
        isOnline: false,
        isAvailable: false
      }
    });
  });
}

module.exports = TrackingController;
