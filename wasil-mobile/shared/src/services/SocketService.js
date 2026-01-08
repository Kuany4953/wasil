/**
 * Wasil Mobile - Socket Service
 * Real-time communication using Socket.io
 */

import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS, SOCKET_EVENTS } from '../constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  /**
   * Connect to socket server
   * @param {string} userId - User ID
   * @param {string} userType - 'rider' or 'driver'
   * @returns {Promise<Socket>}
   */
  async connect(userId, userType) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return this.socket;
    }

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      this.socket = io(API_CONFIG.SOCKET_URL, {
        query: {
          userId,
          userType,
        },
        auth: {
          token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('[Socket] Connected:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Setup default event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnect attempt', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.log('[Socket] Reconnection failed');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('[Socket] Disconnected');
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {Function} callback - Optional callback
   */
  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected. Cannot emit:', event);
      return;
    }
    
    console.log('[Socket] Emit:', event, data);
    
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * Listen for an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] Not connected. Cannot listen:', event);
      return;
    }
    
    this.socket.on(event, callback);
    
    // Track listeners for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback);
      
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  /**
   * Listen for an event once
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  once(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] Not connected. Cannot listen once:', event);
      return;
    }
    
    this.socket.once(event, callback);
  }

  // ==================== DRIVER EVENTS ====================

  /**
   * Send driver location update
   * @param {Object} location - {latitude, longitude, heading, speed}
   */
  updateDriverLocation(location) {
    this.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
      ...location,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set driver online status
   * @param {Object} data - Driver data
   */
  goOnline(data) {
    this.emit(SOCKET_EVENTS.DRIVER_ONLINE, data);
  }

  /**
   * Set driver offline status
   */
  goOffline() {
    this.emit(SOCKET_EVENTS.DRIVER_OFFLINE, {});
  }

  /**
   * Listen for new ride requests (driver)
   * @param {Function} callback
   */
  onNewRideRequest(callback) {
    this.on(SOCKET_EVENTS.NEW_RIDE_REQUEST, callback);
  }

  /**
   * Accept a ride request
   * @param {string} rideId - Ride ID
   * @param {Object} driverData - Driver information
   */
  acceptRide(rideId, driverData) {
    this.emit(SOCKET_EVENTS.RIDE_ACCEPTED, {
      rideId,
      ...driverData,
    });
  }

  /**
   * Decline a ride request
   * @param {string} rideId - Ride ID
   * @param {string} reason - Decline reason
   */
  declineRide(rideId, reason) {
    this.emit('ride:declined', {
      rideId,
      reason,
    });
  }

  /**
   * Notify arrival at pickup
   * @param {string} rideId - Ride ID
   */
  notifyArrival(rideId) {
    this.emit(SOCKET_EVENTS.RIDE_DRIVER_ARRIVING, { rideId });
  }

  /**
   * Start a ride
   * @param {string} rideId - Ride ID
   */
  startRide(rideId) {
    this.emit(SOCKET_EVENTS.RIDE_STARTED, { rideId });
  }

  /**
   * Complete a ride
   * @param {string} rideId - Ride ID
   * @param {Object} rideData - Completion data (fare, distance, etc.)
   */
  completeRide(rideId, rideData) {
    this.emit(SOCKET_EVENTS.RIDE_COMPLETED, {
      rideId,
      ...rideData,
    });
  }

  // ==================== RIDER EVENTS ====================

  /**
   * Request a ride
   * @param {Object} rideRequest - Ride request details
   */
  requestRide(rideRequest) {
    this.emit(SOCKET_EVENTS.RIDE_REQUESTED, rideRequest);
  }

  /**
   * Cancel a ride
   * @param {string} rideId - Ride ID
   * @param {string} reason - Cancellation reason
   */
  cancelRide(rideId, reason) {
    this.emit(SOCKET_EVENTS.RIDE_CANCELLED, {
      rideId,
      reason,
    });
  }

  /**
   * Listen for ride accepted (rider)
   * @param {Function} callback
   */
  onRideAccepted(callback) {
    this.on(SOCKET_EVENTS.RIDE_ACCEPTED, callback);
  }

  /**
   * Listen for driver location updates
   * @param {Function} callback
   */
  onDriverLocation(callback) {
    this.on(SOCKET_EVENTS.DRIVER_LOCATION, callback);
  }

  /**
   * Listen for driver arriving
   * @param {Function} callback
   */
  onDriverArriving(callback) {
    this.on(SOCKET_EVENTS.RIDE_DRIVER_ARRIVING, callback);
  }

  /**
   * Listen for ride started
   * @param {Function} callback
   */
  onRideStarted(callback) {
    this.on(SOCKET_EVENTS.RIDE_STARTED, callback);
  }

  /**
   * Listen for ride completed
   * @param {Function} callback
   */
  onRideCompleted(callback) {
    this.on(SOCKET_EVENTS.RIDE_COMPLETED, callback);
  }

  /**
   * Listen for ride cancelled
   * @param {Function} callback
   */
  onRideCancelled(callback) {
    this.on(SOCKET_EVENTS.RIDE_CANCELLED, callback);
  }

  // ==================== MESSAGING ====================

  /**
   * Send a chat message
   * @param {string} rideId - Ride ID
   * @param {string} message - Message content
   */
  sendMessage(rideId, message) {
    this.emit(SOCKET_EVENTS.MESSAGE_SENT, {
      rideId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for incoming messages
   * @param {Function} callback
   */
  onMessageReceived(callback) {
    this.on(SOCKET_EVENTS.MESSAGE_RECEIVED, callback);
  }

  // ==================== UTILITY ====================

  /**
   * Join a ride room for real-time updates
   * @param {string} rideId - Ride ID
   */
  joinRideRoom(rideId) {
    this.emit('ride:join', { rideId });
  }

  /**
   * Leave a ride room
   * @param {string} rideId - Ride ID
   */
  leaveRideRoom(rideId) {
    this.emit('ride:leave', { rideId });
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

export default new SocketService();
