/**
 * Driver Matching Service
 * 
 * Handles finding and matching available drivers to ride requests.
 * 
 * @module services/matchingService
 */

const db = require('../config/database');
const redis = require('../config/redis');
const Location = require('../models/Location');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');
const { calculateDistance, estimateTravelTime } = require('../utils/distance');
const { DRIVER_SEARCH, REDIS_KEYS, REQUEST_STATUS } = require('../utils/constants');

class MatchingService {
  /**
   * Find nearby available drivers for a ride request
   * 
   * @param {number} latitude - Pickup latitude
   * @param {number} longitude - Pickup longitude
   * @param {number} [radius=5] - Search radius in miles
   * @param {number} [limit=5] - Maximum drivers to return
   * @returns {Promise<Array>} List of nearby drivers with distance info
   */
  static async findNearbyDrivers(latitude, longitude, radius = DRIVER_SEARCH.MAX_RADIUS_MILES, limit = DRIVER_SEARCH.MAX_DRIVERS_TO_NOTIFY) {
    logger.debug('Finding nearby drivers', { latitude, longitude, radius, limit });

    try {
      // Try MongoDB first (real-time locations)
      let drivers = await Location.findNearbyDrivers(latitude, longitude, radius, limit * 2);
      
      // If MongoDB doesn't have enough drivers, fall back to PostgreSQL
      if (drivers.length < limit) {
        const pgDrivers = await this.findNearbyDriversFromPostgres(latitude, longitude, radius, limit);
        
        // Merge and deduplicate
        const driverIds = new Set(drivers.map(d => d.driverId));
        for (const driver of pgDrivers) {
          if (!driverIds.has(driver.driverId)) {
            drivers.push(driver);
          }
        }
      }

      // Calculate distance for each driver and sort
      const driversWithDistance = drivers.map(driver => ({
        ...driver,
        distanceToPickup: calculateDistance(
          driver.latitude,
          driver.longitude,
          latitude,
          longitude
        ),
        etaSeconds: estimateTravelTime(
          calculateDistance(driver.latitude, driver.longitude, latitude, longitude)
        )
      }));

      // Sort by distance (closest first)
      driversWithDistance.sort((a, b) => a.distanceToPickup - b.distanceToPickup);

      // Return top N drivers
      const result = driversWithDistance.slice(0, limit);
      
      logger.info('Found nearby drivers', { 
        count: result.length, 
        searchRadius: radius,
        closestDriverDistance: result[0]?.distanceToPickup 
      });

      return result;
    } catch (error) {
      logger.error('Error finding nearby drivers', { error: error.message });
      throw error;
    }
  }

  /**
   * Find nearby drivers from PostgreSQL (fallback)
   * 
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radius - Search radius in miles
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} List of drivers
   */
  static async findNearbyDriversFromPostgres(latitude, longitude, radius, limit) {
    // Calculate bounding box for initial filter
    const latDelta = radius / 69; // ~69 miles per degree of latitude
    const lonDelta = radius / (69 * Math.cos(latitude * Math.PI / 180));

    const query = `
      SELECT 
        driver_id as "driverId",
        latitude,
        longitude,
        heading,
        speed,
        updated_at as "lastUpdated"
      FROM driver_locations
      WHERE is_available = true
        AND is_online = true
        AND current_ride_id IS NULL
        AND latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
        AND updated_at > NOW() - INTERVAL '5 minutes'
      LIMIT $5
    `;

    const values = [
      latitude - latDelta,
      latitude + latDelta,
      longitude - lonDelta,
      longitude + lonDelta,
      limit * 2 // Get more than needed for distance filtering
    ];

    try {
      const result = await db.query(query, values);
      return result.rows.map(row => ({
        driverId: row.driverId,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        heading: row.heading,
        speed: row.speed,
        lastUpdated: row.lastUpdated
      }));
    } catch (error) {
      logger.error('Error finding drivers from PostgreSQL', { error: error.message });
      return [];
    }
  }

  /**
   * Match a ride to the best available driver
   * 
   * This implements the matching algorithm that considers:
   * 1. Distance to pickup (closest first)
   * 2. Driver rating (higher is better)
   * 3. Acceptance rate (higher is better)
   * 
   * @param {Object} ride - Ride object
   * @returns {Promise<Array>} Ranked list of drivers to notify
   */
  static async matchDriversForRide(ride) {
    const { pickup, id: rideId } = ride;
    
    logger.info('Matching drivers for ride', { rideId });

    try {
      // Find nearby drivers
      const nearbyDrivers = await this.findNearbyDrivers(
        pickup.latitude,
        pickup.longitude,
        DRIVER_SEARCH.MAX_RADIUS_MILES,
        DRIVER_SEARCH.MAX_DRIVERS_TO_NOTIFY * 2 // Get extra for filtering
      );

      if (nearbyDrivers.length === 0) {
        logger.warn('No nearby drivers found', { rideId });
        return [];
      }

      // TODO: Enhance with driver ratings and acceptance rates
      // For now, just use distance-based matching
      const rankedDrivers = nearbyDrivers
        .slice(0, DRIVER_SEARCH.MAX_DRIVERS_TO_NOTIFY)
        .map((driver, index) => ({
          ...driver,
          rank: index + 1
        }));

      logger.info('Drivers matched for ride', { 
        rideId, 
        matchedCount: rankedDrivers.length 
      });

      return rankedDrivers;
    } catch (error) {
      logger.error('Error matching drivers for ride', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Send ride request to drivers
   * Creates ride request records and stores in Redis for expiry
   * 
   * @param {Object} ride - Ride object
   * @param {Array} drivers - List of drivers to notify
   * @returns {Promise<Array>} Created ride requests
   */
  static async sendRideRequestsToDrivers(ride, drivers) {
    const { id: rideId } = ride;
    
    logger.info('Sending ride requests to drivers', { rideId, driverCount: drivers.length });

    const requests = [];

    try {
      for (const driver of drivers) {
        // Create ride request record in database
        const request = await Ride.createRideRequest(
          rideId,
          driver.driverId,
          driver.distanceToPickup
        );

        // Store in Redis with expiry for quick lookup
        const redisKey = `${REDIS_KEYS.RIDE_REQUESTS}${rideId}:${driver.driverId}`;
        await redis.set(
          redisKey,
          JSON.stringify({
            rideId,
            driverId: driver.driverId,
            status: REQUEST_STATUS.PENDING,
            createdAt: new Date().toISOString()
          }),
          DRIVER_SEARCH.REQUEST_EXPIRY_SECONDS
        );

        requests.push({
          ...request,
          driver
        });
      }

      // Set overall ride request expiry
      await redis.set(
        `${REDIS_KEYS.RIDE_REQUESTS}${rideId}`,
        JSON.stringify({
          rideId,
          driverCount: drivers.length,
          createdAt: new Date().toISOString()
        }),
        DRIVER_SEARCH.REQUEST_EXPIRY_SECONDS
      );

      logger.info('Ride requests sent', { rideId, requestCount: requests.length });
      return requests;
    } catch (error) {
      logger.error('Error sending ride requests', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if driver can accept a ride
   * 
   * @param {number} driverId - Driver ID
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object>} Validation result
   */
  static async canDriverAcceptRide(driverId, rideId) {
    try {
      // Check if ride is still available
      const ride = await Ride.findById(rideId);
      
      if (!ride) {
        return { canAccept: false, reason: 'Ride not found' };
      }

      if (ride.status !== 'requested') {
        return { canAccept: false, reason: 'Ride is no longer available' };
      }

      if (ride.driverId) {
        return { canAccept: false, reason: 'Ride already has a driver' };
      }

      // Check if driver has pending request for this ride
      const requestKey = `${REDIS_KEYS.RIDE_REQUESTS}${rideId}:${driverId}`;
      const request = await redis.get(requestKey);
      
      if (!request) {
        // Check database as fallback
        const pendingRequests = await Ride.getPendingRequests(rideId);
        const driverRequest = pendingRequests.find(r => r.driver_id === driverId);
        
        if (!driverRequest) {
          return { canAccept: false, reason: 'No pending request for this driver' };
        }
      }

      // Check if driver is available
      const driverLocation = await Location.getDriverLocation(driverId);
      if (!driverLocation || !driverLocation.isAvailable) {
        return { canAccept: false, reason: 'Driver is not available' };
      }

      // Check if driver already has an active ride
      const activeRide = await Ride.findActiveByDriver(driverId);
      if (activeRide) {
        return { canAccept: false, reason: 'Driver already has an active ride' };
      }

      return { canAccept: true, ride };
    } catch (error) {
      logger.error('Error checking if driver can accept', { driverId, rideId, error: error.message });
      return { canAccept: false, reason: 'Error validating request' };
    }
  }

  /**
   * Process driver acceptance of a ride
   * Uses transaction to prevent race conditions
   * 
   * @param {number} driverId - Driver ID
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object>} Result of acceptance
   */
  static async processDriverAcceptance(driverId, rideId) {
    logger.info('Processing driver acceptance', { driverId, rideId });

    try {
      // Accept the ride (with transaction for race condition handling)
      const updatedRide = await Ride.acceptRide(rideId, driverId);

      // Update driver status in MongoDB
      await Location.assignRideToDriver(driverId, rideId);

      // Clear Redis entries for this ride's requests
      const drivers = await Ride.getPendingRequests(rideId);
      for (const driver of drivers) {
        await redis.del(`${REDIS_KEYS.RIDE_REQUESTS}${rideId}:${driver.driver_id}`);
      }
      await redis.del(`${REDIS_KEYS.RIDE_REQUESTS}${rideId}`);

      logger.info('Driver acceptance processed', { driverId, rideId });

      return {
        success: true,
        ride: updatedRide
      };
    } catch (error) {
      logger.error('Error processing driver acceptance', { driverId, rideId, error: error.message });
      
      // Handle race condition - another driver accepted first
      if (error.message.includes('no longer available') || error.message.includes('already has a driver')) {
        return {
          success: false,
          reason: 'Ride was accepted by another driver'
        };
      }

      throw error;
    }
  }

  /**
   * Process driver decline of a ride
   * 
   * @param {number} driverId - Driver ID
   * @param {number} rideId - Ride ID
   * @returns {Promise<boolean>} Success status
   */
  static async processDriverDecline(driverId, rideId) {
    logger.info('Processing driver decline', { driverId, rideId });

    try {
      // Update database
      await Ride.declineRideRequest(rideId, driverId);

      // Clear Redis entry
      await redis.del(`${REDIS_KEYS.RIDE_REQUESTS}${rideId}:${driverId}`);

      // Check if any pending requests remain
      const pendingRequests = await Ride.getPendingRequests(rideId);
      
      if (pendingRequests.length === 0) {
        logger.warn('All drivers declined ride', { rideId });
        // TODO: Expand search radius or notify rider
      }

      return true;
    } catch (error) {
      logger.error('Error processing driver decline', { driverId, rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Handle expired ride requests
   * Called by a scheduled job to mark expired requests
   * 
   * @param {number} rideId - Ride ID
   */
  static async handleExpiredRequests(rideId) {
    logger.info('Handling expired requests', { rideId });

    try {
      const query = `
        UPDATE ride_requests
        SET status = $1, responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = $2 
          AND status = $3
          AND created_at < NOW() - INTERVAL '${DRIVER_SEARCH.REQUEST_EXPIRY_SECONDS} seconds'
      `;

      await db.query(query, [REQUEST_STATUS.EXPIRED, rideId, REQUEST_STATUS.PENDING]);

      // Check if ride still needs a driver
      const ride = await Ride.findById(rideId);
      if (ride && ride.status === 'requested' && !ride.driverId) {
        // Expand search or notify rider
        logger.warn('Ride still needs driver after expiry', { rideId });
        // TODO: Implement retry logic
      }
    } catch (error) {
      logger.error('Error handling expired requests', { rideId, error: error.message });
    }
  }

  /**
   * Get estimated arrival time for driver
   * 
   * @param {Object} driverLocation - Driver's current location
   * @param {Object} pickup - Pickup location
   * @returns {number} ETA in seconds
   */
  static calculateDriverETA(driverLocation, pickup) {
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      pickup.latitude,
      pickup.longitude
    );

    return estimateTravelTime(distance);
  }

  /**
   * Get driver statistics (for matching algorithm enhancement)
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object>} Driver statistics
   */
  static async getDriverStats(driverId) {
    const query = `
      SELECT 
        COUNT(*) as total_rides,
        AVG(driver_rating) as avg_rating,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN cancelled_by = 'driver' THEN 1 END) as driver_cancellations
      FROM rides
      WHERE driver_id = $1
    `;

    try {
      const result = await db.query(query, [driverId]);
      const stats = result.rows[0];

      return {
        totalRides: parseInt(stats.total_rides, 10),
        avgRating: stats.avg_rating ? parseFloat(stats.avg_rating) : 5.0,
        completedRides: parseInt(stats.completed_rides, 10),
        cancellationRate: stats.total_rides > 0 
          ? stats.driver_cancellations / stats.total_rides 
          : 0,
        acceptanceRate: 0.95 // TODO: Calculate from ride_requests
      };
    } catch (error) {
      logger.error('Error getting driver stats', { driverId, error: error.message });
      return {
        totalRides: 0,
        avgRating: 5.0,
        completedRides: 0,
        cancellationRate: 0,
        acceptanceRate: 1.0
      };
    }
  }
}

module.exports = MatchingService;
