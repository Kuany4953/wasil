/**
 * Location Service
 * 
 * Handles real-time location tracking for rides and drivers.
 * 
 * @module services/locationService
 */

const Location = require('../models/Location');
const redis = require('../config/redis');
const socketService = require('../config/socket');
const logger = require('../utils/logger');
const { calculateDistance, calculateRouteDistance, estimateTravelTime } = require('../utils/distance');
const { REDIS_KEYS, LOCATION_CONFIG } = require('../utils/constants');

class LocationService {
  /**
   * Update driver's current location
   * 
   * @param {number} driverId - Driver ID
   * @param {Object} location - Location data
   * @param {number} location.latitude - Latitude
   * @param {number} location.longitude - Longitude
   * @param {number} [location.heading] - Direction in degrees
   * @param {number} [location.speed] - Speed in mph
   * @returns {Promise<Object>} Updated location
   */
  static async updateDriverLocation(driverId, location) {
    try {
      // Update in MongoDB for geospatial queries
      await Location.updateDriverLocation(driverId, location);

      // Cache in Redis for fast access
      const redisKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        updatedAt: new Date().toISOString()
      };
      
      await redis.set(redisKey, JSON.stringify(locationData), 60); // 60 second TTL

      logger.debug('Driver location updated', { driverId, latitude: location.latitude, longitude: location.longitude });
      
      return locationData;
    } catch (error) {
      logger.error('Error updating driver location', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get driver's current location
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object|null>} Driver location or null
   */
  static async getDriverLocation(driverId) {
    try {
      // Try Redis first (faster)
      const redisKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;
      const cachedLocation = await redis.get(redisKey);
      
      if (cachedLocation) {
        return JSON.parse(cachedLocation);
      }

      // Fall back to MongoDB
      return await Location.getDriverLocation(driverId);
    } catch (error) {
      logger.error('Error getting driver location', { driverId, error: error.message });
      return null;
    }
  }

  /**
   * Update location during an active ride
   * 
   * @param {number} rideId - Ride ID
   * @param {number} driverId - Driver ID
   * @param {Object} location - Location data
   * @returns {Promise<Object>} Update result with ETA info
   */
  static async updateRideLocation(rideId, driverId, location) {
    try {
      // Update driver's location
      await this.updateDriverLocation(driverId, location);

      // Add location to ride tracking history
      await Location.addLocationToRide(rideId, {
        ...location,
        source: 'driver'
      });

      // Broadcast to rider via Socket.io
      socketService.emitToRide(rideId, socketService.SOCKET_EVENTS.DRIVER_LOCATION, {
        rideId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading,
          speed: location.speed
        },
        timestamp: new Date().toISOString()
      });

      logger.debug('Ride location updated', { rideId, driverId });

      return { success: true };
    } catch (error) {
      logger.error('Error updating ride location', { rideId, driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Start tracking a ride
   * Creates a new tracking record in MongoDB
   * 
   * @param {Object} ride - Ride object
   * @returns {Promise<Object>} Tracking record
   */
  static async startRideTracking(ride) {
    try {
      const tracking = await Location.createRideTracking(
        ride.id,
        ride.riderId,
        ride.pickup
      );

      logger.info('Ride tracking started', { rideId: ride.id });
      return tracking;
    } catch (error) {
      logger.error('Error starting ride tracking', { rideId: ride.id, error: error.message });
      throw error;
    }
  }

  /**
   * Complete ride tracking and calculate final distance
   * 
   * @param {number} rideId - Ride ID
   * @param {Object} endLocation - Final location
   * @returns {Promise<Object>} Tracking summary
   */
  static async completeRideTracking(rideId, endLocation) {
    try {
      // Get all waypoints for the ride
      const tracking = await Location.getRideTracking(rideId);
      
      if (!tracking) {
        logger.warn('No tracking data found for ride', { rideId });
        return { totalDistance: 0 };
      }

      // Calculate total distance from waypoints
      const totalDistance = calculateRouteDistance(tracking.locations);

      // Complete tracking record
      await Location.completeRideTracking(rideId, endLocation, totalDistance);

      logger.info('Ride tracking completed', { rideId, totalDistance });

      return {
        totalDistance,
        waypointCount: tracking.locations.length,
        startLocation: tracking.startLocation,
        endLocation
      };
    } catch (error) {
      logger.error('Error completing ride tracking', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate current ETA from driver to destination
   * 
   * @param {Object} driverLocation - Driver's current location
   * @param {Object} destination - Destination location
   * @returns {Object} ETA information
   */
  static calculateETA(driverLocation, destination) {
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    const etaSeconds = estimateTravelTime(distance);
    const etaTime = new Date(Date.now() + etaSeconds * 1000);

    return {
      distanceRemaining: distance,
      etaSeconds,
      etaTime: etaTime.toISOString(),
      formattedETA: this.formatETA(etaSeconds)
    };
  }

  /**
   * Format ETA for display
   * 
   * @param {number} seconds - ETA in seconds
   * @returns {string} Formatted ETA string
   */
  static formatETA(seconds) {
    if (seconds < 60) {
      return 'Less than 1 min';
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours} hr ${minutes} min`;
    }
  }

  /**
   * Check if driver is near pickup location
   * 
   * @param {Object} driverLocation - Driver's location
   * @param {Object} pickup - Pickup location
   * @param {number} [thresholdMiles=0.1] - Distance threshold in miles
   * @returns {boolean} True if driver is near pickup
   */
  static isDriverNearPickup(driverLocation, pickup, thresholdMiles = 0.1) {
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      pickup.latitude,
      pickup.longitude
    );

    return distance <= thresholdMiles;
  }

  /**
   * Check if driver has arrived at pickup
   * 
   * @param {Object} driverLocation - Driver's location
   * @param {Object} pickup - Pickup location
   * @returns {boolean} True if driver has arrived
   */
  static hasDriverArrived(driverLocation, pickup) {
    // Consider arrived if within ~500 feet (~0.095 miles)
    return this.isDriverNearPickup(driverLocation, pickup, 0.095);
  }

  /**
   * Set driver availability status
   * 
   * @param {number} driverId - Driver ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Object>} Updated status
   */
  static async setDriverAvailability(driverId, isAvailable) {
    try {
      await Location.setDriverAvailability(driverId, isAvailable);

      // Update Redis cache
      const redisKey = `${REDIS_KEYS.DRIVER_AVAILABILITY}${driverId}`;
      await redis.set(redisKey, isAvailable.toString(), 300); // 5 minute TTL

      logger.info('Driver availability set', { driverId, isAvailable });

      return { driverId, isAvailable };
    } catch (error) {
      logger.error('Error setting driver availability', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get driver availability status
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<boolean>} Availability status
   */
  static async getDriverAvailability(driverId) {
    try {
      // Try Redis first
      const redisKey = `${REDIS_KEYS.DRIVER_AVAILABILITY}${driverId}`;
      const cached = await redis.get(redisKey);
      
      if (cached !== null) {
        return cached === 'true';
      }

      // Fall back to MongoDB
      const location = await Location.getDriverLocation(driverId);
      return location ? location.isAvailable : false;
    } catch (error) {
      logger.error('Error getting driver availability', { driverId, error: error.message });
      return false;
    }
  }

  /**
   * Clear driver's ride assignment
   * Called when ride is completed or cancelled
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<void>}
   */
  static async clearDriverRide(driverId) {
    try {
      await Location.clearDriverRide(driverId);
      logger.info('Driver ride cleared', { driverId });
    } catch (error) {
      logger.error('Error clearing driver ride', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get location update history for a ride
   * 
   * @param {number} rideId - Ride ID
   * @returns {Promise<Array>} Location history
   */
  static async getRideLocationHistory(rideId) {
    try {
      const tracking = await Location.getRideTracking(rideId);
      return tracking ? tracking.locations : [];
    } catch (error) {
      logger.error('Error getting ride location history', { rideId, error: error.message });
      return [];
    }
  }

  /**
   * Get statistics for nearby drivers
   * 
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} [radius=5] - Search radius in miles
   * @returns {Promise<Object>} Driver statistics
   */
  static async getNearbyDriverStats(latitude, longitude, radius = 5) {
    try {
      const drivers = await Location.findNearbyDrivers(latitude, longitude, radius, 100);
      
      return {
        total: drivers.length,
        available: drivers.filter(d => d.isAvailable !== false).length,
        averageDistance: drivers.length > 0 
          ? drivers.reduce((sum, d) => {
              return sum + calculateDistance(d.latitude, d.longitude, latitude, longitude);
            }, 0) / drivers.length
          : 0,
        closestDriver: drivers.length > 0 
          ? calculateDistance(drivers[0].latitude, drivers[0].longitude, latitude, longitude)
          : null
      };
    } catch (error) {
      logger.error('Error getting nearby driver stats', { error: error.message });
      return { total: 0, available: 0, averageDistance: 0, closestDriver: null };
    }
  }

  /**
   * Check if location data is stale
   * 
   * @param {Date|string} lastUpdate - Last update timestamp
   * @returns {boolean} True if location is stale
   */
  static isLocationStale(lastUpdate) {
    if (!lastUpdate) return true;
    
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    
    return (now - lastUpdateTime) > LOCATION_CONFIG.STALE_LOCATION_THRESHOLD_MS;
  }
}

module.exports = LocationService;
