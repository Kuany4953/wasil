/**
 * Wasil Mobile - Ride Service
 * API operations for ride management
 */

import { get, post, patch } from '../api/client';
import { API_CONFIG } from '../constants';

class RideService {
  constructor() {
    this.baseUrl = '/rides';
  }

  /**
   * Get fare estimate for a route
   * @param {Object} params - Route parameters
   * @param {Object} params.pickup - {latitude, longitude, address}
   * @param {Object} params.dropoff - {latitude, longitude, address}
   * @param {string} params.rideType - Ride type (boda_boda, standard, premium)
   * @returns {Promise<Object>} - Fare estimate with all ride types
   */
  async getFareEstimate(params) {
    try {
      const response = await post(`${this.baseUrl}/estimate`, {
        pickup: params.pickup,
        dropoff: params.dropoff,
        rideType: params.rideType || 'standard',
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get fare estimate');
    }
  }

  /**
   * Request a new ride
   * @param {Object} rideData - Ride request data
   * @param {Object} rideData.pickup - Pickup location {latitude, longitude, address}
   * @param {Object} rideData.dropoff - Dropoff location {latitude, longitude, address}
   * @param {string} rideData.rideType - Ride type
   * @param {string} rideData.paymentMethod - Payment method
   * @returns {Promise<Object>} - Created ride
   */
  async requestRide(rideData) {
    try {
      const response = await post(`${this.baseUrl}/request`, rideData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to request ride');
    }
  }

  /**
   * Get ride by ID
   * @param {string} rideId - Ride ID
   * @returns {Promise<Object>} - Ride details
   */
  async getRide(rideId) {
    try {
      const response = await get(`${this.baseUrl}/${rideId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get ride');
    }
  }

  /**
   * Get active ride for current user
   * @returns {Promise<Object|null>} - Active ride or null
   */
  async getActiveRide() {
    try {
      const response = await get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.message || 'Failed to get active ride');
    }
  }

  /**
   * Cancel a ride
   * @param {string} rideId - Ride ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancelled ride
   */
  async cancelRide(rideId, reason) {
    try {
      const response = await post(`${this.baseUrl}/${rideId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel ride');
    }
  }

  /**
   * Rate a completed ride
   * @param {string} rideId - Ride ID
   * @param {number} rating - Rating (1-5)
   * @param {string} feedback - Optional feedback
   * @param {number} tip - Optional tip amount in SSP
   * @returns {Promise<Object>} - Updated ride
   */
  async rateRide(rideId, rating, feedback = '', tip = 0) {
    try {
      const response = await post(`${this.baseUrl}/${rideId}/rate`, {
        rating,
        feedback,
        tip,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to rate ride');
    }
  }

  /**
   * Get ride history for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @returns {Promise<Object>} - Paginated ride history
   */
  async getRideHistory(params = {}) {
    try {
      const response = await get(`${this.baseUrl}/history`, {
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get ride history');
    }
  }

  /**
   * Get ride receipt
   * @param {string} rideId - Ride ID
   * @returns {Promise<Object>} - Receipt data
   */
  async getReceipt(rideId) {
    try {
      const response = await get(`${this.baseUrl}/${rideId}/receipt`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get receipt');
    }
  }

  // ==================== DRIVER METHODS ====================

  /**
   * Accept a ride request (driver)
   * @param {string} rideId - Ride ID
   * @param {Object} location - Current driver location
   * @returns {Promise<Object>} - Accepted ride
   */
  async acceptRide(rideId, location) {
    try {
      const response = await post(`${this.baseUrl}/${rideId}/accept`, {
        driverLocation: location,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to accept ride');
    }
  }

  /**
   * Decline a ride request (driver)
   * @param {string} rideId - Ride ID
   * @param {string} reason - Decline reason
   * @returns {Promise<void>}
   */
  async declineRide(rideId, reason) {
    try {
      await post(`${this.baseUrl}/${rideId}/decline`, { reason });
    } catch (error) {
      throw new Error(error.message || 'Failed to decline ride');
    }
  }

  /**
   * Mark arrival at pickup (driver)
   * @param {string} rideId - Ride ID
   * @returns {Promise<Object>} - Updated ride
   */
  async arriveAtPickup(rideId) {
    try {
      const response = await patch(`${this.baseUrl}/${rideId}/arrive`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to mark arrival');
    }
  }

  /**
   * Start the ride (driver)
   * @param {string} rideId - Ride ID
   * @returns {Promise<Object>} - Updated ride
   */
  async startRide(rideId) {
    try {
      const response = await patch(`${this.baseUrl}/${rideId}/start`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to start ride');
    }
  }

  /**
   * Complete the ride (driver)
   * @param {string} rideId - Ride ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} - Completed ride with fare
   */
  async completeRide(rideId, completionData = {}) {
    try {
      const response = await patch(`${this.baseUrl}/${rideId}/complete`, completionData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to complete ride');
    }
  }

  /**
   * Get available ride requests (driver)
   * @param {Object} location - Driver's current location
   * @returns {Promise<Array>} - List of available ride requests
   */
  async getAvailableRequests(location) {
    try {
      const response = await get(`${this.baseUrl}/available`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get available requests');
    }
  }

  /**
   * Get driver earnings
   * @param {string} period - 'today', 'week', 'month'
   * @returns {Promise<Object>} - Earnings data
   */
  async getEarnings(period = 'today') {
    try {
      const response = await get(`${this.baseUrl}/earnings`, { period });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get earnings');
    }
  }

  /**
   * Get driver statistics
   * @returns {Promise<Object>} - Driver stats
   */
  async getDriverStats() {
    try {
      const response = await get(`${this.baseUrl}/driver/stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get driver stats');
    }
  }

  // ==================== SAVED PLACES ====================

  /**
   * Get user's saved places
   * @returns {Promise<Array>} - List of saved places
   */
  async getSavedPlaces() {
    try {
      const response = await get('/places/saved');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get saved places');
    }
  }

  /**
   * Save a new place
   * @param {Object} place - Place data
   * @returns {Promise<Object>} - Saved place
   */
  async savePlace(place) {
    try {
      const response = await post('/places/saved', place);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to save place');
    }
  }

  /**
   * Delete a saved place
   * @param {string} placeId - Place ID
   * @returns {Promise<void>}
   */
  async deleteSavedPlace(placeId) {
    try {
      await post(`/places/saved/${placeId}/delete`);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete place');
    }
  }

  /**
   * Search for places (landmarks, addresses)
   * @param {string} query - Search query
   * @param {Object} location - Current location for nearby results
   * @returns {Promise<Array>} - Search results
   */
  async searchPlaces(query, location) {
    try {
      const response = await get('/places/search', {
        query,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to search places');
    }
  }

  /**
   * Get Juba landmarks
   * @returns {Promise<Array>} - List of landmarks
   */
  async getLandmarks() {
    try {
      const response = await get('/places/landmarks');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get landmarks');
    }
  }

  // ==================== EMERGENCY ====================

  /**
   * Send SOS alert
   * @param {string} rideId - Current ride ID (if any)
   * @param {Object} location - Current location
   * @param {string} alertType - Type of emergency
   * @returns {Promise<Object>} - SOS alert response
   */
  async sendSOSAlert(rideId, location, alertType = 'emergency') {
    try {
      const response = await post('/emergency/sos', {
        rideId,
        location,
        alertType,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to send SOS alert');
    }
  }

  /**
   * Share ride with emergency contacts
   * @param {string} rideId - Ride ID
   * @param {Array<string>} contactIds - Contact IDs to share with
   * @returns {Promise<void>}
   */
  async shareRide(rideId, contactIds) {
    try {
      await post(`${this.baseUrl}/${rideId}/share`, { contactIds });
    } catch (error) {
      throw new Error(error.message || 'Failed to share ride');
    }
  }

  /**
   * Get emergency contacts
   * @returns {Promise<Array>} - List of emergency contacts
   */
  async getEmergencyContacts() {
    try {
      const response = await get('/emergency/contacts');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get emergency contacts');
    }
  }

  /**
   * Add emergency contact
   * @param {Object} contact - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addEmergencyContact(contact) {
    try {
      const response = await post('/emergency/contacts', contact);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add emergency contact');
    }
  }
}

export default new RideService();
