/**
 * MongoDB Configuration
 * 
 * This module handles MongoDB connection for storing
 * real-time location tracking data during rides.
 * 
 * @module config/mongodb
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wasil_tracking';

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,              // Maximum number of sockets in the connection pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000,        // Close sockets after 45 seconds of inactivity
  family: 4                      // Use IPv4
};

// Track connection state
let isConnected = false;

/**
 * Connect to MongoDB
 * 
 * @returns {Promise<boolean>} True if connection successful
 */
const connect = async () => {
  if (isConnected) {
    logger.debug('MongoDB already connected');
    return true;
  }
  
  try {
    await mongoose.connect(mongoUri, mongoOptions);
    isConnected = true;
    logger.info('MongoDB connection successful', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    return false;
  }
};

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown
 */
const disconnect = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: error.message });
  }
};

/**
 * Get connection status
 * 
 * @returns {boolean} Connection status
 */
const getConnectionStatus = () => isConnected;

/**
 * Get the mongoose connection
 * 
 * @returns {Object} Mongoose connection
 */
const getConnection = () => mongoose.connection;

// Connection event handlers
mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.debug('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  disconnect,
  getConnectionStatus,
  getConnection,
  mongoose
};
