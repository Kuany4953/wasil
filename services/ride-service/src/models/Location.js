/**
 * Location Model (MongoDB)
 * 
 * Handles location tracking data stored in MongoDB.
 * Used for real-time ride tracking and location history.
 * 
 * @module models/Location
 */

const { mongoose } = require('../config/mongodb');
const logger = require('../utils/logger');

// Location point schema (embedded)
const LocationPointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    min: 0,
    max: 359
  },
  accuracy: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['driver', 'rider'],
    default: 'driver'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Ride tracking schema
const RideTrackingSchema = new mongoose.Schema({
  rideId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  riderId: {
    type: Number,
    required: true,
    index: true
  },
  driverId: {
    type: Number,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  locations: [LocationPointSchema],
  startLocation: {
    type: LocationPointSchema
  },
  endLocation: {
    type: LocationPointSchema
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ride_tracking',
  timestamps: true
});

// Index for geospatial queries on the last location
RideTrackingSchema.index({ 'locations.timestamp': -1 });

// Driver location schema (real-time)
const DriverLocationSchema = new mongoose.Schema({
  driverId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  heading: {
    type: Number,
    min: 0,
    max: 359
  },
  speed: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  currentRideId: {
    type: Number,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'driver_locations',
  timestamps: true
});

// Geospatial index for nearby driver queries
DriverLocationSchema.index({ location: '2dsphere' });
DriverLocationSchema.index({ isAvailable: 1, isOnline: 1 });

// Create models
const RideTracking = mongoose.model('RideTracking', RideTrackingSchema);
const DriverLocation = mongoose.model('DriverLocation', DriverLocationSchema);

/**
 * Location Service Class
 * Provides methods for location-related operations
 */
class Location {
  // ==========================================
  // RIDE TRACKING METHODS
  // ==========================================

  /**
   * Create a new ride tracking record
   * 
   * @param {number} rideId - Ride ID
   * @param {number} riderId - Rider ID
   * @param {Object} startLocation - Starting location
   * @returns {Promise<Object>} Created tracking record
   */
  static async createRideTracking(rideId, riderId, startLocation = null) {
    try {
      const tracking = new RideTracking({
        rideId,
        riderId,
        startLocation: startLocation ? {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          timestamp: new Date()
        } : null,
        locations: startLocation ? [{
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          source: 'rider',
          timestamp: new Date()
        }] : []
      });

      await tracking.save();
      logger.info('Ride tracking created', { rideId });
      return tracking;
    } catch (error) {
      logger.error('Error creating ride tracking', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Add location update to ride tracking
   * 
   * @param {number} rideId - Ride ID
   * @param {Object} location - Location data
   * @returns {Promise<Object>} Updated tracking record
   */
  static async addLocationToRide(rideId, location) {
    try {
      const update = await RideTracking.findOneAndUpdate(
        { rideId, status: 'active' },
        {
          $push: {
            locations: {
              latitude: location.latitude,
              longitude: location.longitude,
              speed: location.speed || 0,
              heading: location.heading,
              source: location.source || 'driver',
              timestamp: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      if (!update) {
        logger.warn('No active tracking found for ride', { rideId });
        return null;
      }

      logger.debug('Location added to ride', { rideId });
      return update;
    } catch (error) {
      logger.error('Error adding location to ride', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Get ride tracking by ride ID
   * 
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object|null>} Tracking record or null
   */
  static async getRideTracking(rideId) {
    try {
      return await RideTracking.findOne({ rideId });
    } catch (error) {
      logger.error('Error getting ride tracking', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Get latest location for a ride
   * 
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object|null>} Latest location or null
   */
  static async getLatestRideLocation(rideId) {
    try {
      const tracking = await RideTracking.findOne(
        { rideId },
        { locations: { $slice: -1 } }
      );

      if (!tracking || tracking.locations.length === 0) {
        return null;
      }

      return tracking.locations[0];
    } catch (error) {
      logger.error('Error getting latest ride location', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Complete ride tracking
   * 
   * @param {number} rideId - Ride ID
   * @param {Object} endLocation - End location
   * @param {number} totalDistance - Total distance traveled
   * @returns {Promise<Object>} Updated tracking record
   */
  static async completeRideTracking(rideId, endLocation, totalDistance) {
    try {
      const update = await RideTracking.findOneAndUpdate(
        { rideId },
        {
          $set: {
            status: 'completed',
            endLocation: {
              latitude: endLocation.latitude,
              longitude: endLocation.longitude,
              timestamp: new Date()
            },
            totalDistance,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      logger.info('Ride tracking completed', { rideId, totalDistance });
      return update;
    } catch (error) {
      logger.error('Error completing ride tracking', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Cancel ride tracking
   * 
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object>} Updated tracking record
   */
  static async cancelRideTracking(rideId) {
    try {
      const update = await RideTracking.findOneAndUpdate(
        { rideId },
        {
          $set: {
            status: 'cancelled',
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      logger.info('Ride tracking cancelled', { rideId });
      return update;
    } catch (error) {
      logger.error('Error cancelling ride tracking', { rideId, error: error.message });
      throw error;
    }
  }

  // ==========================================
  // DRIVER LOCATION METHODS
  // ==========================================

  /**
   * Update driver location
   * 
   * @param {number} driverId - Driver ID
   * @param {Object} location - Location data
   * @returns {Promise<Object>} Updated driver location
   */
  static async updateDriverLocation(driverId, location) {
    try {
      const update = await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          $set: {
            location: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            heading: location.heading,
            speed: location.speed || 0,
            lastUpdated: new Date()
          }
        },
        { new: true, upsert: true }
      );

      logger.debug('Driver location updated', { driverId });
      return update;
    } catch (error) {
      logger.error('Error updating driver location', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get driver location
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object|null>} Driver location or null
   */
  static async getDriverLocation(driverId) {
    try {
      const driver = await DriverLocation.findOne({ driverId });
      
      if (!driver) {
        return null;
      }

      return {
        driverId: driver.driverId,
        latitude: driver.location.coordinates[1],
        longitude: driver.location.coordinates[0],
        heading: driver.heading,
        speed: driver.speed,
        isAvailable: driver.isAvailable,
        isOnline: driver.isOnline,
        lastUpdated: driver.lastUpdated
      };
    } catch (error) {
      logger.error('Error getting driver location', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Find nearby available drivers using geospatial query
   * 
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radiusMiles - Search radius in miles
   * @param {number} limit - Maximum drivers to return
   * @returns {Promise<Array>} Array of nearby drivers
   */
  static async findNearbyDrivers(latitude, longitude, radiusMiles, limit = 10) {
    try {
      // Convert miles to meters (MongoDB uses meters for geospatial)
      const radiusMeters = radiusMiles * 1609.34;

      const drivers = await DriverLocation.find({
        isAvailable: true,
        isOnline: true,
        currentRideId: null,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusMeters
          }
        }
      }).limit(limit);

      // Format and calculate distance for each driver
      return drivers.map(driver => ({
        driverId: driver.driverId,
        latitude: driver.location.coordinates[1],
        longitude: driver.location.coordinates[0],
        heading: driver.heading,
        speed: driver.speed,
        lastUpdated: driver.lastUpdated
      }));
    } catch (error) {
      logger.error('Error finding nearby drivers', { latitude, longitude, error: error.message });
      throw error;
    }
  }

  /**
   * Set driver availability
   * 
   * @param {number} driverId - Driver ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Object>} Updated driver location
   */
  static async setDriverAvailability(driverId, isAvailable) {
    try {
      const update = await DriverLocation.findOneAndUpdate(
        { driverId },
        { $set: { isAvailable, lastUpdated: new Date() } },
        { new: true, upsert: true }
      );

      logger.info('Driver availability updated', { driverId, isAvailable });
      return update;
    } catch (error) {
      logger.error('Error setting driver availability', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Set driver online status
   * 
   * @param {number} driverId - Driver ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<Object>} Updated driver location
   */
  static async setDriverOnlineStatus(driverId, isOnline) {
    try {
      const update = await DriverLocation.findOneAndUpdate(
        { driverId },
        { 
          $set: { 
            isOnline,
            isAvailable: isOnline ? undefined : false, // If going offline, set unavailable
            lastUpdated: new Date() 
          } 
        },
        { new: true }
      );

      logger.info('Driver online status updated', { driverId, isOnline });
      return update;
    } catch (error) {
      logger.error('Error setting driver online status', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Assign ride to driver
   * 
   * @param {number} driverId - Driver ID
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object>} Updated driver location
   */
  static async assignRideToDriver(driverId, rideId) {
    try {
      const update = await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          $set: {
            currentRideId: rideId,
            isAvailable: false,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );

      logger.info('Ride assigned to driver', { driverId, rideId });
      return update;
    } catch (error) {
      logger.error('Error assigning ride to driver', { driverId, rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Clear driver's current ride
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object>} Updated driver location
   */
  static async clearDriverRide(driverId) {
    try {
      const update = await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          $set: {
            currentRideId: null,
            isAvailable: true,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );

      logger.info('Driver ride cleared', { driverId });
      return update;
    } catch (error) {
      logger.error('Error clearing driver ride', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get online drivers count
   * 
   * @returns {Promise<number>} Count of online drivers
   */
  static async getOnlineDriversCount() {
    try {
      return await DriverLocation.countDocuments({ isOnline: true });
    } catch (error) {
      logger.error('Error getting online drivers count', { error: error.message });
      throw error;
    }
  }

  /**
   * Get available drivers count
   * 
   * @returns {Promise<number>} Count of available drivers
   */
  static async getAvailableDriversCount() {
    try {
      return await DriverLocation.countDocuments({ isAvailable: true, isOnline: true });
    } catch (error) {
      logger.error('Error getting available drivers count', { error: error.message });
      throw error;
    }
  }
}

module.exports = Location;
