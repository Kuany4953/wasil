/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user information to request.
 * 
 * @module middleware/authenticate
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

/**
 * Authenticate request using JWT token
 * 
 * Extracts and verifies the JWT token from the Authorization header.
 * If valid, attaches the decoded user information to req.user.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'No authorization header provided'
        }
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization format');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid authorization format. Use Bearer token'
        }
      });
    }

    // Extract token
    const token = authHeader.substring(7);
    
    if (!token) {
      logger.warn('No token provided');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'No token provided'
        }
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Server configuration error'
        }
      });
    }

    // Decode and verify
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      // Include any other claims
      ...decoded
    };

    logger.debug('User authenticated', { userId: req.user.id, role: req.user.role });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Token has expired'
        }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { error: error.message });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token'
        }
      });
    }

    logger.error('Authentication error', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Optional authentication
 * 
 * Tries to authenticate but doesn't fail if no token is provided.
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token, continue without user
    req.user = null;
    return next();
  }

  // Try to authenticate
  authenticate(req, res, (err) => {
    if (err) {
      // Authentication failed, continue without user
      req.user = null;
    }
    next();
  });
};

/**
 * Extract user ID from request
 * 
 * Helper function to get user ID from authenticated request
 * 
 * @param {Object} req - Express request object
 * @returns {number|null} User ID or null
 */
const getUserId = (req) => {
  return req.user ? req.user.id : null;
};

/**
 * Check if request is authenticated
 * 
 * @param {Object} req - Express request object
 * @returns {boolean} True if authenticated
 */
const isAuthenticated = (req) => {
  return req.user !== null && req.user !== undefined;
};

module.exports = {
  authenticate,
  optionalAuth,
  getUserId,
  isAuthenticated
};
