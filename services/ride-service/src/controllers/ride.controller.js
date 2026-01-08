/**
 * Ride Controller
 * 
 * Handles all ride-related HTTP endpoints.
 * 
 * @module controllers/ride.controller
 */

const Ride = require('../models/Ride');
const FareService = require('../services/fareService');
const MatchingService = require('../services/matchingService');
const LocationService = require('../services/locationService');
const NotificationService = require('../services/notificationService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { calculateDistance, estimateTravelTime, formatDuration } = require('../utils/distance');
const { 
  HTTP_STATUS, 
  ERROR_CODES, 
  RIDE_STATUS,
  CANCELLATION 
} = require('../utils/constants');

class RideController {
  /**
   * Request a new ride
   * POST /api/v1/rides
   */
  static requestRide = asyncHandler(async (req, res) => {
    const { pickup, dropoff, rideType } = req.body;
    const riderId = req.user.id;

    logger.info('Ride request received', { riderId, rideType });

    // Check if rider already has an active ride
    const activeRide = await Ride.findActiveByRider(riderId);
    if (activeRide) {
      throw new AppError(
        'You already have an active ride',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RIDER_HAS_ACTIVE_RIDE
      );
    }

    // Calculate distance and estimated duration
    const estimatedDistance = calculateDistance(
      pickup.latitude,
      pickup.longitude,
      dropoff.latitude,
      dropoff.longitude
    );
    const estimatedDuration = estimateTravelTime(estimatedDistance);

    // Calculate fare
    const fareBreakdown = FareService.calculateEstimatedFare({
      distance: estimatedDistance,
      duration: estimatedDuration,
      rideType
    });

    // Create ride record
    const ride = await Ride.create({
      riderId,
      pickup,
      dropoff,
      rideType,
      estimatedDistance,
      estimatedDuration,
      estimatedFare: fareBreakdown.totalFare,
      baseFare: fareBreakdown.baseFare,
      distanceFare: fareBreakdown.distanceFare,
      timeFare: fareBreakdown.timeFare,
      surgeMultiplier: fareBreakdown.surgeMultiplier
    });

    // Start ride tracking
    await LocationService.startRideTracking(ride);

    // Find nearby drivers
    const nearbyDrivers = await MatchingService.matchDriversForRide(ride);

    if (nearbyDrivers.length > 0) {
      // Create ride requests for drivers
      await MatchingService.sendRideRequestsToDrivers(ride, nearbyDrivers);

      // Notify drivers via Socket.io and RabbitMQ
      await NotificationService.notifyDriversOfNewRide(nearbyDrivers, ride);
    } else {
      logger.warn('No nearby drivers found', { rideId: ride.id });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Ride requested successfully',
      data: {
        ride,
        fare: fareBreakdown,
        driversNotified: nearbyDrivers.length,
        estimatedDuration: formatDuration(estimatedDuration)
      }
    });
  });

  /**
   * Get ride by ID
   * GET /api/v1/rides/:id
   */
  static getRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    // Verify user is involved in the ride
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw AppError.forbidden('You do not have access to this ride');
    }

    res.json({
      success: true,
      data: { ride }
    });
  });

  /**
   * Get ride history for user
   * GET /api/v1/rides
   */
  static getRideHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { page = 1, limit = 20 } = req.query;

    const result = await Ride.getHistory(userId, role, { 
      page: parseInt(page, 10), 
      limit: parseInt(limit, 10) 
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Accept a ride (driver)
   * POST /api/v1/rides/:id/accept
   */
  static acceptRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;

    logger.info('Driver accepting ride', { rideId, driverId });

    // Validate that driver can accept
    const validation = await MatchingService.canDriverAcceptRide(driverId, rideId);

    if (!validation.canAccept) {
      throw new AppError(
        validation.reason,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.RIDE_ALREADY_ACCEPTED
      );
    }

    // Process acceptance
    const result = await MatchingService.processDriverAcceptance(driverId, rideId);

    if (!result.success) {
      throw new AppError(
        result.reason,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RIDE_ALREADY_ACCEPTED
      );
    }

    // Get driver location for ETA
    const driverLocation = await LocationService.getDriverLocation(driverId);
    const eta = driverLocation 
      ? LocationService.calculateETA(driverLocation, result.ride.pickup)
      : null;

    // Notify rider
    await NotificationService.notifyRiderOfAcceptance(result.ride, {
      id: driverId,
      // TODO: Include driver details from User Service
    });

    // Notify other drivers that ride was taken
    const pendingRequests = await Ride.getPendingRequests(rideId);
    const otherDriverIds = pendingRequests.map(r => r.driver_id);
    await NotificationService.notifyDriversRideTaken(rideId, otherDriverIds, driverId);

    res.json({
      success: true,
      message: 'Ride accepted successfully',
      data: {
        ride: result.ride,
        eta
      }
    });
  });

  /**
   * Decline a ride (driver)
   * POST /api/v1/rides/:id/decline
   */
  static declineRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;

    logger.info('Driver declining ride', { rideId, driverId });

    await MatchingService.processDriverDecline(driverId, rideId);

    res.json({
      success: true,
      message: 'Ride declined'
    });
  });

  /**
   * Driver arrived at pickup
   * POST /api/v1/rides/:id/arrive
   */
  static arriveAtPickup = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw AppError.forbidden('You are not the driver for this ride');
    }

    if (ride.status !== RIDE_STATUS.ACCEPTED) {
      throw new AppError(
        'Cannot mark as arrived in current status',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    // Update ride status
    const updatedRide = await Ride.updateStatus(rideId, RIDE_STATUS.ARRIVING);

    // Notify rider
    await NotificationService.notifyRiderDriverArrived(updatedRide);

    res.json({
      success: true,
      message: 'Marked as arrived at pickup',
      data: { ride: updatedRide }
    });
  });

  /**
   * Start the ride
   * POST /api/v1/rides/:id/start
   */
  static startRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw AppError.forbidden('You are not the driver for this ride');
    }

    if (ride.status !== RIDE_STATUS.ARRIVING) {
      throw new AppError(
        'Cannot start ride in current status',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    // Update ride status
    const updatedRide = await Ride.updateStatus(rideId, RIDE_STATUS.IN_PROGRESS);

    // Notify both parties
    await NotificationService.notifyRideStarted(updatedRide);

    res.json({
      success: true,
      message: 'Ride started',
      data: { ride: updatedRide }
    });
  });

  /**
   * Complete the ride
   * POST /api/v1/rides/:id/complete
   */
  static completeRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw AppError.forbidden('You are not the driver for this ride');
    }

    if (ride.status !== RIDE_STATUS.IN_PROGRESS) {
      throw new AppError(
        'Cannot complete ride in current status',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    // Get driver's current location as end point
    const driverLocation = await LocationService.getDriverLocation(driverId);
    const endLocation = driverLocation || ride.dropoff;

    // Complete tracking and get actual distance
    const trackingSummary = await LocationService.completeRideTracking(rideId, endLocation);

    // Calculate actual duration (from started_at to now)
    const startedAt = new Date(ride.startedAt);
    const actualDuration = Math.round((Date.now() - startedAt.getTime()) / 1000);

    // Use tracked distance or estimated if no tracking
    const actualDistance = trackingSummary.totalDistance || ride.estimatedDistance;

    // Calculate actual fare
    const fareBreakdown = FareService.calculateActualFare({
      actualDistance,
      actualDuration,
      rideType: ride.rideType,
      surgeMultiplier: ride.surgeMultiplier
    });

    // Complete the ride in database
    const completedRide = await Ride.completeRide(rideId, {
      actualDistance,
      actualDuration,
      actualFare: fareBreakdown.totalFare
    });

    // Clear driver's current ride
    await LocationService.clearDriverRide(driverId);

    // Notify both parties
    await NotificationService.notifyRideCompleted(completedRide);

    res.json({
      success: true,
      message: 'Ride completed successfully',
      data: {
        ride: completedRide,
        fare: fareBreakdown,
        tracking: {
          distance: actualDistance,
          duration: actualDuration,
          waypointCount: trackingSummary.waypointCount
        }
      }
    });
  });

  /**
   * Cancel the ride
   * POST /api/v1/rides/:id/cancel
   */
  static cancelRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    // Verify user is involved
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw AppError.forbidden('You cannot cancel this ride');
    }

    // Verify ride can be cancelled
    const cancellableStatuses = [
      RIDE_STATUS.REQUESTED,
      RIDE_STATUS.ACCEPTED,
      RIDE_STATUS.ARRIVING,
      RIDE_STATUS.IN_PROGRESS
    ];

    if (!cancellableStatuses.includes(ride.status)) {
      throw new AppError(
        'Ride cannot be cancelled in current status',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STATUS_TRANSITION
      );
    }

    // Determine who is cancelling
    const cancelledBy = userRole === 'driver' 
      ? CANCELLATION.CANCELLED_BY.DRIVER 
      : CANCELLATION.CANCELLED_BY.RIDER;

    // Calculate cancellation fee
    const cancellationFee = FareService.calculateCancellationFee(ride, cancelledBy);

    // Cancel the ride
    const cancelledRide = await Ride.cancelRide(rideId, cancelledBy, reason);

    // Clear driver's ride if assigned
    if (ride.driverId) {
      await LocationService.clearDriverRide(ride.driverId);
    }

    // Cancel tracking
    await require('../models/Location').cancelRideTracking(rideId);

    // Notify parties
    await NotificationService.notifyRideCancelled(cancelledRide, cancelledBy, reason);

    res.json({
      success: true,
      message: 'Ride cancelled',
      data: {
        ride: cancelledRide,
        cancellationFee
      }
    });
  });

  /**
   * Rate a completed ride
   * POST /api/v1/rides/:id/rate
   */
  static rateRide = asyncHandler(async (req, res) => {
    const rideId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { rating, feedback } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw AppError.notFound('Ride not found');
    }

    // Verify user is involved
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw AppError.forbidden('You cannot rate this ride');
    }

    // Verify ride is completed
    if (ride.status !== RIDE_STATUS.COMPLETED) {
      throw new AppError(
        'Can only rate completed rides',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_RIDE_STATUS
      );
    }

    // Check if already rated
    const raterRole = ride.riderId === userId ? 'rider' : 'driver';
    const existingRating = raterRole === 'rider' ? ride.driverRating : ride.riderRating;

    if (existingRating) {
      throw new AppError(
        'You have already rated this ride',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RIDE_ALREADY_ACTIVE // TODO: Add proper error code
      );
    }

    // Add rating
    const updatedRide = await Ride.addRating(rideId, raterRole, rating, feedback);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { ride: updatedRide }
    });
  });

  /**
   * Get rider's active ride
   * GET /api/v1/rides/active/rider
   */
  static getActiveRiderRide = asyncHandler(async (req, res) => {
    const riderId = req.user.id;

    const ride = await Ride.findActiveByRider(riderId);

    if (!ride) {
      return res.json({
        success: true,
        data: { ride: null }
      });
    }

    // If ride has a driver, get driver location
    let driverLocation = null;
    let eta = null;

    if (ride.driverId && ride.status !== RIDE_STATUS.REQUESTED) {
      driverLocation = await LocationService.getDriverLocation(ride.driverId);
      
      if (driverLocation) {
        const destination = ride.status === RIDE_STATUS.IN_PROGRESS 
          ? ride.dropoff 
          : ride.pickup;
        eta = LocationService.calculateETA(driverLocation, destination);
      }
    }

    res.json({
      success: true,
      data: {
        ride,
        driverLocation,
        eta
      }
    });
  });

  /**
   * Get driver's active ride
   * GET /api/v1/rides/active/driver
   */
  static getActiveDriverRide = asyncHandler(async (req, res) => {
    const driverId = req.user.id;

    const ride = await Ride.findActiveByDriver(driverId);

    if (!ride) {
      return res.json({
        success: true,
        data: { ride: null }
      });
    }

    // Calculate ETA to next destination
    const driverLocation = await LocationService.getDriverLocation(driverId);
    let eta = null;

    if (driverLocation) {
      const destination = ride.status === RIDE_STATUS.IN_PROGRESS 
        ? ride.dropoff 
        : ride.pickup;
      eta = LocationService.calculateETA(driverLocation, destination);
    }

    res.json({
      success: true,
      data: {
        ride,
        eta
      }
    });
  });

  /**
   * Get fare estimate
   * POST /api/v1/rides/estimate
   */
  static getFareEstimate = asyncHandler(async (req, res) => {
    const { pickup, dropoff, rideType = 'standard' } = req.body;

    const estimate = FareService.calculateFareEstimate(pickup, dropoff, rideType);
    const fareRange = FareService.getFareRange(pickup, dropoff, rideType);

    res.json({
      success: true,
      data: {
        distance: estimate.distance,
        duration: estimate.duration,
        formattedDuration: formatDuration(estimate.duration),
        fare: {
          estimated: estimate.estimatedFare,
          range: fareRange.formatted.range,
          breakdown: estimate.fareBreakdown
        },
        allRideTypes: estimate.allRideTypes,
        surgeMultiplier: estimate.surgeMultiplier
      }
    });
  });
}

module.exports = RideController;
