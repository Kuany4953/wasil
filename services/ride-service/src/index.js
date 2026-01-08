/**
 * Wasil Ride Service - Main Entry Point
 * 
 * This service handles all ride-related operations including:
 * - Ride requests and matching
 * - Real-time location tracking
 * - Fare calculation
 * - Driver availability management
 * 
 * @module index
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuration
const db = require('./config/database');
const mongodb = require('./config/mongodb');
const redis = require('./config/redis');
const { initializeSocket } = require('./config/socket');

// Middleware
const logger = require('./utils/logger');
const { 
  notFoundHandler, 
  errorHandler,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
  setupGracefulShutdown
} = require('./middleware/errorHandler');

// Routes
const rideRoutes = require('./routes/ride.routes');
const trackingRoutes = require('./routes/tracking.routes');

// Services
const NotificationService = require('./services/notificationService');

// Setup error handlers
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// ==========================================
// MIDDLEWARE
// ==========================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use(logger.requestLogger);

// ==========================================
// HEALTH CHECK ENDPOINTS
// ==========================================

/**
 * Basic health check
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'ride-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed health check with dependencies
 */
app.get('/health/detailed', async (req, res) => {
  const health = {
    success: true,
    service: 'ride-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {}
  };

  // Check PostgreSQL
  try {
    await db.testConnection();
    health.dependencies.postgresql = 'connected';
  } catch (error) {
    health.dependencies.postgresql = 'disconnected';
    health.status = 'degraded';
  }

  // Check MongoDB
  health.dependencies.mongodb = mongodb.getConnectionStatus() ? 'connected' : 'disconnected';
  if (!mongodb.getConnectionStatus()) {
    health.status = 'degraded';
  }

  // Check Redis
  health.dependencies.redis = redis.getConnectionStatus() ? 'connected' : 'disconnected';
  if (!redis.getConnectionStatus()) {
    health.status = 'degraded';
  }

  // Check RabbitMQ
  health.dependencies.rabbitmq = NotificationService.isConnected() ? 'connected' : 'disconnected';
  if (!NotificationService.isConnected()) {
    health.status = 'degraded';
  }

  // Socket.io stats
  const socketService = require('./config/socket');
  health.connections = socketService.getConnectionStats();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ==========================================
// API ROUTES
// ==========================================

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
app.use(`${API_PREFIX}/rides`, rideRoutes);
app.use(`${API_PREFIX}/drivers`, trackingRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ==========================================
// SERVER INITIALIZATION
// ==========================================

const PORT = process.env.RIDE_SERVICE_PORT || 3002;

/**
 * Initialize all connections and start server
 */
async function startServer() {
  try {
    logger.info('Starting Ride Service...');

    // Connect to PostgreSQL
    logger.info('Connecting to PostgreSQL...');
    const pgConnected = await db.testConnection();
    if (!pgConnected) {
      logger.warn('PostgreSQL connection failed, some features may not work');
    }

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    const mongoConnected = await mongodb.connect();
    if (!mongoConnected) {
      logger.warn('MongoDB connection failed, location tracking may not work');
    }

    // Connect to Redis
    logger.info('Connecting to Redis...');
    const redisConnected = await redis.connect();
    if (!redisConnected) {
      logger.warn('Redis connection failed, caching may not work');
    }

    // Initialize RabbitMQ
    logger.info('Connecting to RabbitMQ...');
    const rabbitConnected = await NotificationService.initialize();
    if (!rabbitConnected) {
      logger.warn('RabbitMQ connection failed, notifications may not work');
    }

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`========================================`);
      logger.info(`  Wasil Ride Service`);
      logger.info(`  Version: 1.0.0`);
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  HTTP Server: http://localhost:${PORT}`);
      logger.info(`  WebSocket: ws://localhost:${PORT}`);
      logger.info(`========================================`);
      logger.info(`  Endpoints:`);
      logger.info(`  - Rides: ${API_PREFIX}/rides`);
      logger.info(`  - Drivers: ${API_PREFIX}/drivers`);
      logger.info(`  - Health: /health`);
      logger.info(`========================================`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
  logger.info('Cleaning up resources...');
  
  try {
    // Close database connections
    await db.closePool();
    await mongodb.disconnect();
    await redis.disconnect();
    await NotificationService.close();
    
    // Close HTTP server
    server.close();
    
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error during cleanup', { error: error.message });
  }
}

// Setup graceful shutdown
setupGracefulShutdown(cleanup);

// Start the server
startServer();

// Export for testing
module.exports = { app, server };
