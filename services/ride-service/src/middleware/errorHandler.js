/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling for the application.
 * 
 * @module middleware/errorHandler
 */

const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

/**
 * Custom Application Error class
 * 
 * Use this to throw errors with specific status codes and error codes.
 */
class AppError extends Error {
  /**
   * Create an AppError
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR, errorCode = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a Bad Request error
   */
  static badRequest(message, details = null) {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }

  /**
   * Create an Unauthorized error
   */
  static unauthorized(message = 'Authentication required') {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  /**
   * Create a Forbidden error
   */
  static forbidden(message = 'Access denied') {
    return new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  /**
   * Create a Not Found error
   */
  static notFound(message = 'Resource not found') {
    return new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RIDE_NOT_FOUND);
  }

  /**
   * Create a Conflict error
   */
  static conflict(message, errorCode = ERROR_CODES.RIDE_ALREADY_ACTIVE) {
    return new AppError(message, HTTP_STATUS.CONFLICT, errorCode);
  }

  /**
   * Create an Internal Server error
   */
  static internal(message = 'Internal server error') {
    return new AppError(message, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to catch errors and pass them to the error handler.
 * Eliminates the need for try-catch in every route handler.
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/rides/:id', asyncHandler(async (req, res) => {
 *   const ride = await Ride.findById(req.params.id);
 *   if (!ride) throw AppError.notFound('Ride not found');
 *   res.json(ride);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * 
 * Catches requests to undefined routes.
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.RIDE_NOT_FOUND
  );
  next(error);
};

/**
 * Global error handler middleware
 * 
 * Handles all errors that occur in the application.
 * Must be registered last in the middleware chain.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Joi or Mongoose validation error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    if (err.details) {
      details = err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Token has expired';
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = HTTP_STATUS.CONFLICT;
    errorCode = ERROR_CODES.RIDE_ALREADY_ACTIVE;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Referenced resource does not exist';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    errorCode = ERROR_CODES.DATABASE_ERROR;
    message = 'Service temporarily unavailable';
  }

  // Log error
  const logData = {
    errorCode,
    statusCode,
    message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip
  };

  if (statusCode >= 500) {
    // Server errors - log full stack
    logger.error('Server error', {
      ...logData,
      stack: err.stack
    });
  } else if (statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client error', logData);
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500 && !err.isOperational) {
    message = 'Internal server error';
    details = null;
  }

  // Send error response
  const response = {
    success: false,
    error: {
      code: errorCode,
      message
    }
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle uncaught exceptions
 * 
 * Logs the error and exits the process gracefully.
 * Should be set up at application startup.
 */
const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    // Give logger time to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

/**
 * Handle unhandled promise rejections
 * 
 * Logs the error. In Node.js 15+, this will cause the process to exit.
 */
const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });
};

/**
 * Graceful shutdown handler
 * 
 * Handles SIGTERM and SIGINT signals for graceful shutdown.
 * 
 * @param {Function} cleanup - Async function to clean up resources
 */
const setupGracefulShutdown = (cleanup) => {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      if (cleanup) {
        await cleanup();
      }
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
  setupGracefulShutdown
};
