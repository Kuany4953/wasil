/**
 * Authorization Middleware
 * 
 * Provides role-based access control for routes.
 * 
 * @module middleware/authorize
 */

const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES, USER_ROLES } = require('../utils/constants');

/**
 * Authorize user based on roles
 * 
 * Creates a middleware that checks if the authenticated user
 * has one of the allowed roles.
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only drivers can access
 * router.post('/accept', authenticate, authorize('driver'), controller.accept);
 * 
 * // Both riders and drivers can access
 * router.get('/rides/:id', authenticate, authorize('rider', 'driver'), controller.getRide);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Authorization failed: No user in request');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required'
        }
      });
    }

    const userRole = req.user.role;

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to perform this action'
        }
      });
    }

    logger.debug('User authorized', { userId: req.user.id, role: userRole });
    next();
  };
};

/**
 * Authorize rider only
 * Convenience middleware for rider-only routes
 */
const riderOnly = authorize(USER_ROLES.RIDER);

/**
 * Authorize driver only
 * Convenience middleware for driver-only routes
 */
const driverOnly = authorize(USER_ROLES.DRIVER);

/**
 * Authorize admin only
 * Convenience middleware for admin-only routes
 */
const adminOnly = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is the owner of a resource
 * 
 * Creates middleware that checks if the authenticated user
 * owns the requested resource (e.g., ride).
 * 
 * @param {Function} getOwnerId - Function that extracts owner ID from request
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.delete('/rides/:id', authenticate, isOwner((req) => req.ride.riderId), controller.delete);
 */
const isOwner = (getOwnerId) => {
  return (req, res, next) => {
    const userId = req.user.id;
    const ownerId = getOwnerId(req);

    if (userId !== ownerId) {
      logger.warn('Authorization failed: User is not the owner', {
        userId,
        ownerId
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to access this resource'
        }
      });
    }

    next();
  };
};

/**
 * Check if user is involved in a ride (either rider or driver)
 * 
 * @param {Object} req - Express request object
 * @param {Object} ride - Ride object
 * @returns {boolean} True if user is involved
 */
const isInvolvedInRide = (req, ride) => {
  if (!req.user || !ride) {
    return false;
  }

  const userId = req.user.id;
  return ride.riderId === userId || ride.driverId === userId;
};

/**
 * Middleware to verify user is involved in the ride
 * Must be used after ride is loaded into req.ride
 */
const rideParticipant = (req, res, next) => {
  if (!req.ride) {
    logger.error('Ride not loaded in request');
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ride not loaded'
      }
    });
  }

  if (!isInvolvedInRide(req, req.ride)) {
    logger.warn('User not involved in ride', {
      userId: req.user.id,
      rideId: req.ride.id,
      riderId: req.ride.riderId,
      driverId: req.ride.driverId
    });
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'You are not a participant in this ride'
      }
    });
  }

  next();
};

/**
 * Check if user can perform action on ride based on role and ride state
 * 
 * @param {string} action - Action to perform
 * @returns {Function} Express middleware function
 */
const canPerformRideAction = (action) => {
  return (req, res, next) => {
    if (!req.user || !req.ride) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Missing user or ride information'
        }
      });
    }

    const { role, id: userId } = req.user;
    const { riderId, driverId, status } = req.ride;
    
    // Define who can perform what actions
    const permissions = {
      accept: {
        allowedRoles: ['driver'],
        allowedStatuses: ['requested'],
        additionalCheck: () => !driverId // Only if no driver assigned yet
      },
      decline: {
        allowedRoles: ['driver'],
        allowedStatuses: ['requested'],
        additionalCheck: () => true
      },
      arrive: {
        allowedRoles: ['driver'],
        allowedStatuses: ['accepted'],
        additionalCheck: () => userId === driverId
      },
      start: {
        allowedRoles: ['driver'],
        allowedStatuses: ['arriving'],
        additionalCheck: () => userId === driverId
      },
      complete: {
        allowedRoles: ['driver'],
        allowedStatuses: ['in_progress'],
        additionalCheck: () => userId === driverId
      },
      cancel: {
        allowedRoles: ['rider', 'driver', 'admin'],
        allowedStatuses: ['requested', 'accepted', 'arriving', 'in_progress'],
        additionalCheck: () => isInvolvedInRide(req, req.ride) || role === 'admin'
      },
      rate: {
        allowedRoles: ['rider', 'driver'],
        allowedStatuses: ['completed'],
        additionalCheck: () => isInvolvedInRide(req, req.ride)
      }
    };

    const permission = permissions[action];
    if (!permission) {
      logger.error('Unknown action', { action });
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Unknown action'
        }
      });
    }

    // Check role
    if (!permission.allowedRoles.includes(role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `Only ${permission.allowedRoles.join(' or ')} can perform this action`
        }
      });
    }

    // Check status
    if (!permission.allowedStatuses.includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_RIDE_STATUS,
          message: `Cannot ${action} a ride in ${status} status`
        }
      });
    }

    // Additional check
    if (!permission.additionalCheck()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You cannot perform this action'
        }
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  riderOnly,
  driverOnly,
  adminOnly,
  isOwner,
  isInvolvedInRide,
  rideParticipant,
  canPerformRideAction
};
