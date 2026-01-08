/**
 * Ride Model
 * 
 * Handles all database operations for rides in PostgreSQL.
 * Implements repository pattern for data access.
 * 
 * @module models/Ride
 */

const db = require('../config/database');
const logger = require('../utils/logger');
const { 
  RIDE_STATUS, 
  VALID_STATUS_TRANSITIONS,
  REQUEST_STATUS 
} = require('../utils/constants');

class Ride {
  /**
   * Create a new ride
   * 
   * @param {Object} rideData - Ride data
   * @returns {Promise<Object>} Created ride
   */
  static async create(rideData) {
    const {
      riderId,
      pickup,
      dropoff,
      rideType = 'standard',
      estimatedDistance,
      estimatedDuration,
      estimatedFare,
      baseFare,
      distanceFare,
      timeFare,
      surgeMultiplier = 1.0
    } = rideData;

    const query = `
      INSERT INTO rides (
        rider_id, 
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        ride_type, status,
        estimated_distance, estimated_duration, estimated_fare,
        base_fare, distance_fare, time_fare, surge_multiplier
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const values = [
      riderId,
      pickup.latitude,
      pickup.longitude,
      pickup.address,
      dropoff.latitude,
      dropoff.longitude,
      dropoff.address,
      rideType,
      RIDE_STATUS.REQUESTED,
      estimatedDistance,
      estimatedDuration,
      estimatedFare,
      baseFare,
      distanceFare,
      timeFare,
      surgeMultiplier
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Ride created', { rideId: result.rows[0].id });
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error creating ride', { error: error.message });
      throw error;
    }
  }

  /**
   * Find ride by ID
   * 
   * @param {number} id - Ride ID
   * @returns {Promise<Object|null>} Ride or null
   */
  static async findById(id) {
    const query = 'SELECT * FROM rides WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error finding ride by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find ride by UUID
   * 
   * @param {string} uuid - Ride UUID
   * @returns {Promise<Object|null>} Ride or null
   */
  static async findByUuid(uuid) {
    const query = 'SELECT * FROM rides WHERE uuid = $1';
    
    try {
      const result = await db.query(query, [uuid]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error finding ride by UUID', { uuid, error: error.message });
      throw error;
    }
  }

  /**
   * Find active ride for a rider
   * Active statuses: requested, accepted, arriving, in_progress
   * 
   * @param {number} riderId - Rider ID
   * @returns {Promise<Object|null>} Active ride or null
   */
  static async findActiveByRider(riderId) {
    const query = `
      SELECT * FROM rides 
      WHERE rider_id = $1 
      AND status IN ($2, $3, $4, $5)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const values = [
      riderId,
      RIDE_STATUS.REQUESTED,
      RIDE_STATUS.ACCEPTED,
      RIDE_STATUS.ARRIVING,
      RIDE_STATUS.IN_PROGRESS
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error finding active ride for rider', { riderId, error: error.message });
      throw error;
    }
  }

  /**
   * Find active ride for a driver
   * 
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object|null>} Active ride or null
   */
  static async findActiveByDriver(driverId) {
    const query = `
      SELECT * FROM rides 
      WHERE driver_id = $1 
      AND status IN ($2, $3, $4)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const values = [
      driverId,
      RIDE_STATUS.ACCEPTED,
      RIDE_STATUS.ARRIVING,
      RIDE_STATUS.IN_PROGRESS
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error finding active ride for driver', { driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get ride history for a user
   * 
   * @param {number} userId - User ID
   * @param {string} role - User role ('rider' or 'driver')
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Rides and pagination info
   */
  static async getHistory(userId, role, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const column = role === 'driver' ? 'driver_id' : 'rider_id';
    
    const countQuery = `SELECT COUNT(*) FROM rides WHERE ${column} = $1`;
    const dataQuery = `
      SELECT * FROM rides 
      WHERE ${column} = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, [userId]),
        db.query(dataQuery, [userId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const rides = dataResult.rows.map(row => this.formatRide(row));

      return {
        rides,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting ride history', { userId, role, error: error.message });
      throw error;
    }
  }

  /**
   * Update ride status
   * 
   * @param {number} id - Ride ID
   * @param {string} newStatus - New status
   * @param {Object} additionalData - Additional fields to update
   * @returns {Promise<Object>} Updated ride
   */
  static async updateStatus(id, newStatus, additionalData = {}) {
    // Get current ride to validate transition
    const ride = await this.findById(id);
    if (!ride) {
      throw new Error('Ride not found');
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[ride.status] || [];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${ride.status} to ${newStatus}`);
    }

    // Build update query dynamically
    const updates = ['status = $1'];
    const values = [newStatus];
    let paramIndex = 2;

    // Add timestamp based on status
    const timestampField = this.getTimestampField(newStatus);
    if (timestampField) {
      updates.push(`${timestampField} = CURRENT_TIMESTAMP`);
    }

    // Add any additional data
    for (const [key, value] of Object.entries(additionalData)) {
      const dbField = this.camelToSnake(key);
      updates.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    const query = `
      UPDATE rides 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      logger.info('Ride status updated', { rideId: id, newStatus });
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error updating ride status', { id, newStatus, error: error.message });
      throw error;
    }
  }

  /**
   * Accept a ride (assign driver)
   * 
   * @param {number} rideId - Ride ID
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object>} Updated ride
   */
  static async acceptRide(rideId, driverId) {
    return db.transaction(async (client) => {
      // Check if ride is still available
      const checkQuery = 'SELECT * FROM rides WHERE id = $1 FOR UPDATE';
      const checkResult = await client.query(checkQuery, [rideId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Ride not found');
      }
      
      const ride = checkResult.rows[0];
      if (ride.status !== RIDE_STATUS.REQUESTED) {
        throw new Error('Ride is no longer available');
      }
      
      if (ride.driver_id) {
        throw new Error('Ride already has a driver');
      }

      // Update ride with driver
      const updateQuery = `
        UPDATE rides 
        SET driver_id = $1, status = $2, accepted_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        driverId,
        RIDE_STATUS.ACCEPTED,
        rideId
      ]);

      // Mark other pending requests as taken
      await client.query(`
        UPDATE ride_requests 
        SET status = $1, responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = $2 AND driver_id != $3 AND status = $4
      `, [REQUEST_STATUS.TAKEN, rideId, driverId, REQUEST_STATUS.PENDING]);

      // Mark this driver's request as accepted
      await client.query(`
        UPDATE ride_requests 
        SET status = $1, responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = $2 AND driver_id = $3
      `, [REQUEST_STATUS.ACCEPTED, rideId, driverId]);

      logger.info('Ride accepted', { rideId, driverId });
      return this.formatRide(updateResult.rows[0]);
    });
  }

  /**
   * Complete a ride
   * 
   * @param {number} rideId - Ride ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} Updated ride
   */
  static async completeRide(rideId, completionData) {
    const {
      actualDistance,
      actualDuration,
      actualFare
    } = completionData;

    const query = `
      UPDATE rides 
      SET 
        status = $1,
        completed_at = CURRENT_TIMESTAMP,
        actual_distance = $2,
        actual_duration = $3,
        actual_fare = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      RIDE_STATUS.COMPLETED,
      actualDistance,
      actualDuration,
      actualFare,
      rideId
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Ride completed', { rideId, actualFare });
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error completing ride', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Cancel a ride
   * 
   * @param {number} rideId - Ride ID
   * @param {string} cancelledBy - Who cancelled ('rider', 'driver', 'system')
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated ride
   */
  static async cancelRide(rideId, cancelledBy, reason = null) {
    const query = `
      UPDATE rides 
      SET 
        status = $1,
        cancelled_at = CURRENT_TIMESTAMP,
        cancelled_by = $2,
        cancellation_reason = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      RIDE_STATUS.CANCELLED,
      cancelledBy,
      reason,
      rideId
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Ride cancelled', { rideId, cancelledBy });
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error cancelling ride', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Add rating to a ride
   * 
   * @param {number} rideId - Ride ID
   * @param {string} raterRole - Who is rating ('rider' or 'driver')
   * @param {number} rating - Rating (1-5)
   * @param {string} feedback - Optional feedback
   * @returns {Promise<Object>} Updated ride
   */
  static async addRating(rideId, raterRole, rating, feedback = null) {
    const ratingField = raterRole === 'rider' ? 'driver_rating' : 'rider_rating';
    const feedbackField = raterRole === 'rider' ? 'driver_feedback' : 'rider_feedback';

    const query = `
      UPDATE rides 
      SET ${ratingField} = $1, ${feedbackField} = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [rating, feedback, rideId]);
      logger.info('Rating added', { rideId, raterRole, rating });
      return this.formatRide(result.rows[0]);
    } catch (error) {
      logger.error('Error adding rating', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Create ride request record for a driver
   * 
   * @param {number} rideId - Ride ID
   * @param {number} driverId - Driver ID
   * @param {number} distanceToPickup - Distance from driver to pickup
   * @returns {Promise<Object>} Created ride request
   */
  static async createRideRequest(rideId, driverId, distanceToPickup) {
    const query = `
      INSERT INTO ride_requests (ride_id, driver_id, distance_to_pickup)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [rideId, driverId, distanceToPickup]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating ride request', { rideId, driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Decline ride request
   * 
   * @param {number} rideId - Ride ID
   * @param {number} driverId - Driver ID
   * @returns {Promise<boolean>} Success status
   */
  static async declineRideRequest(rideId, driverId) {
    const query = `
      UPDATE ride_requests 
      SET status = $1, responded_at = CURRENT_TIMESTAMP
      WHERE ride_id = $2 AND driver_id = $3 AND status = $4
    `;

    try {
      await db.query(query, [
        REQUEST_STATUS.DECLINED,
        rideId,
        driverId,
        REQUEST_STATUS.PENDING
      ]);
      logger.info('Ride request declined', { rideId, driverId });
      return true;
    } catch (error) {
      logger.error('Error declining ride request', { rideId, driverId, error: error.message });
      throw error;
    }
  }

  /**
   * Get pending requests for a ride
   * 
   * @param {number} rideId - Ride ID
   * @returns {Promise<Array>} Pending requests
   */
  static async getPendingRequests(rideId) {
    const query = `
      SELECT * FROM ride_requests 
      WHERE ride_id = $1 AND status = $2
      ORDER BY distance_to_pickup ASC
    `;

    try {
      const result = await db.query(query, [rideId, REQUEST_STATUS.PENDING]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting pending requests', { rideId, error: error.message });
      throw error;
    }
  }

  /**
   * Format database row to camelCase object
   * 
   * @param {Object} row - Database row
   * @returns {Object} Formatted ride object
   */
  static formatRide(row) {
    if (!row) return null;

    return {
      id: row.id,
      uuid: row.uuid,
      riderId: row.rider_id,
      driverId: row.driver_id,
      pickup: {
        latitude: parseFloat(row.pickup_latitude),
        longitude: parseFloat(row.pickup_longitude),
        address: row.pickup_address
      },
      dropoff: {
        latitude: parseFloat(row.dropoff_latitude),
        longitude: parseFloat(row.dropoff_longitude),
        address: row.dropoff_address
      },
      rideType: row.ride_type,
      status: row.status,
      estimatedFare: row.estimated_fare ? parseFloat(row.estimated_fare) : null,
      actualFare: row.actual_fare ? parseFloat(row.actual_fare) : null,
      baseFare: row.base_fare ? parseFloat(row.base_fare) : null,
      distanceFare: row.distance_fare ? parseFloat(row.distance_fare) : null,
      timeFare: row.time_fare ? parseFloat(row.time_fare) : null,
      surgeMultiplier: row.surge_multiplier ? parseFloat(row.surge_multiplier) : 1.0,
      estimatedDistance: row.estimated_distance ? parseFloat(row.estimated_distance) : null,
      actualDistance: row.actual_distance ? parseFloat(row.actual_distance) : null,
      estimatedDuration: row.estimated_duration,
      actualDuration: row.actual_duration,
      requestedAt: row.requested_at,
      acceptedAt: row.accepted_at,
      arrivedAt: row.arrived_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      cancelledBy: row.cancelled_by,
      riderRating: row.rider_rating,
      driverRating: row.driver_rating,
      riderFeedback: row.rider_feedback,
      driverFeedback: row.driver_feedback,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get timestamp field name based on status
   * 
   * @param {string} status - Ride status
   * @returns {string|null} Timestamp field name
   */
  static getTimestampField(status) {
    const mapping = {
      [RIDE_STATUS.ACCEPTED]: 'accepted_at',
      [RIDE_STATUS.ARRIVING]: 'arrived_at',
      [RIDE_STATUS.IN_PROGRESS]: 'started_at',
      [RIDE_STATUS.COMPLETED]: 'completed_at',
      [RIDE_STATUS.CANCELLED]: 'cancelled_at'
    };
    return mapping[status] || null;
  }

  /**
   * Convert camelCase to snake_case
   * 
   * @param {string} str - camelCase string
   * @returns {string} snake_case string
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = Ride;
