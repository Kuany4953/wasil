/**
 * Socket.io Configuration
 * 
 * This module sets up Socket.io for real-time communication
 * between riders, drivers, and the server.
 * 
 * @module config/socket
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Store the io instance for global access
let io = null;

// Track connected users
const connectedUsers = new Map();
const connectedDrivers = new Map();

/**
 * Initialize Socket.io server
 * 
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.io server instance
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      logger.warn('Socket connection rejected: No token provided');
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.warn('Socket connection rejected: Invalid token', { error: error.message });
      return next(new Error('Invalid token'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;
    
    logger.info('Socket connected', { userId, role: userRole, socketId: socket.id });
    
    // Track connected user
    if (userRole === 'driver') {
      connectedDrivers.set(userId, socket.id);
      // Join driver's personal room
      socket.join(`driver-${userId}`);
    } else {
      connectedUsers.set(userId, socket.id);
      // Join rider's personal room
      socket.join(`rider-${userId}`);
    }
    
    // Handle joining a ride room
    socket.on('join-ride', (rideId) => {
      socket.join(`ride-${rideId}`);
      logger.debug('User joined ride room', { userId, rideId });
    });
    
    // Handle leaving a ride room
    socket.on('leave-ride', (rideId) => {
      socket.leave(`ride-${rideId}`);
      logger.debug('User left ride room', { userId, rideId });
    });
    
    // Handle driver location updates
    socket.on('driver-location-update', (data) => {
      const { rideId, latitude, longitude, heading, speed } = data;
      
      // Broadcast to ride room (rider will receive this)
      socket.to(`ride-${rideId}`).emit('driver-location', {
        rideId,
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString()
      });
      
      logger.debug('Driver location update broadcast', { driverId: userId, rideId });
    });
    
    // Handle driver availability toggle
    socket.on('toggle-availability', async (isAvailable) => {
      logger.info('Driver availability toggled', { driverId: userId, isAvailable });
      
      // Emit confirmation back to driver
      socket.emit('availability-updated', { isAvailable });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId, reason, socketId: socket.id });
      
      if (userRole === 'driver') {
        connectedDrivers.delete(userId);
      } else {
        connectedUsers.delete(userId);
      }
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { userId, error: error.message });
    });
  });
  
  logger.info('Socket.io initialized');
  return io;
};

/**
 * Get Socket.io instance
 * 
 * @returns {Object} Socket.io server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit event to a specific ride room
 * 
 * @param {number} rideId - Ride ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToRide = (rideId, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit to ride');
    return;
  }
  
  io.to(`ride-${rideId}`).emit(event, data);
  logger.debug('Event emitted to ride room', { rideId, event });
};

/**
 * Emit event to a specific driver
 * 
 * @param {number} driverId - Driver ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToDriver = (driverId, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit to driver');
    return;
  }
  
  io.to(`driver-${driverId}`).emit(event, data);
  logger.debug('Event emitted to driver', { driverId, event });
};

/**
 * Emit event to multiple drivers
 * 
 * @param {Array<number>} driverIds - Array of driver IDs
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToDrivers = (driverIds, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit to drivers');
    return;
  }
  
  driverIds.forEach(driverId => {
    io.to(`driver-${driverId}`).emit(event, data);
  });
  logger.debug('Event emitted to multiple drivers', { count: driverIds.length, event });
};

/**
 * Emit event to a specific rider
 * 
 * @param {number} riderId - Rider ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToRider = (riderId, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit to rider');
    return;
  }
  
  io.to(`rider-${riderId}`).emit(event, data);
  logger.debug('Event emitted to rider', { riderId, event });
};

/**
 * Check if a driver is connected
 * 
 * @param {number} driverId - Driver ID
 * @returns {boolean} True if driver is connected
 */
const isDriverConnected = (driverId) => {
  return connectedDrivers.has(driverId);
};

/**
 * Check if a user is connected
 * 
 * @param {number} userId - User ID
 * @returns {boolean} True if user is connected
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

/**
 * Get count of connected users
 * 
 * @returns {Object} Connection counts
 */
const getConnectionStats = () => ({
  riders: connectedUsers.size,
  drivers: connectedDrivers.size,
  total: connectedUsers.size + connectedDrivers.size
});

/**
 * Get list of connected driver IDs
 * 
 * @returns {Array<number>} Array of driver IDs
 */
const getConnectedDriverIds = () => {
  return Array.from(connectedDrivers.keys());
};

// Socket.io event constants
const SOCKET_EVENTS = {
  // Ride events
  RIDE_REQUESTED: 'ride-requested',
  RIDE_ACCEPTED: 'ride-accepted',
  RIDE_DECLINED: 'ride-declined',
  RIDE_CANCELLED: 'ride-cancelled',
  RIDE_STARTED: 'ride-started',
  RIDE_COMPLETED: 'ride-completed',
  RIDE_TAKEN: 'ride-taken',
  
  // Driver events
  DRIVER_ARRIVED: 'driver-arrived',
  DRIVER_LOCATION: 'driver-location',
  DRIVER_APPROACHING: 'driver-approaching',
  
  // System events
  ETA_UPDATE: 'eta-update',
  FARE_UPDATE: 'fare-update',
  ERROR: 'error'
};

module.exports = {
  initializeSocket,
  getIO,
  emitToRide,
  emitToDriver,
  emitToDrivers,
  emitToRider,
  isDriverConnected,
  isUserConnected,
  getConnectionStats,
  getConnectedDriverIds,
  SOCKET_EVENTS
};
