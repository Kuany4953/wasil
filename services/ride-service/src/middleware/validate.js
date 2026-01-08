/**
 * Validation Middleware
 * 
 * Provides request validation using Joi schemas.
 * 
 * @module middleware/validate
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

/**
 * Location schema (reusable)
 */
const locationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  address: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Address cannot be empty',
      'any.required': 'Address is required'
    })
});

/**
 * Request ride validation schema
 */
const requestRideSchema = Joi.object({
  pickup: locationSchema.required().messages({
    'any.required': 'Pickup location is required'
  }),
  dropoff: locationSchema.required().messages({
    'any.required': 'Dropoff location is required'
  }),
  rideType: Joi.string()
    .valid('standard', 'premium', 'xl')
    .default('standard')
    .messages({
      'any.only': 'Ride type must be standard, premium, or xl'
    })
});

/**
 * Update location validation schema
 */
const updateLocationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  heading: Joi.number()
    .min(0)
    .max(359)
    .optional()
    .messages({
      'number.min': 'Heading must be between 0 and 359',
      'number.max': 'Heading must be between 0 and 359'
    }),
  speed: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Speed cannot be negative'
    })
});

/**
 * Rate ride validation schema
 */
const rateRideSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5',
      'any.required': 'Rating is required'
    }),
  feedback: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Feedback cannot exceed 500 characters'
    })
});

/**
 * Cancel ride validation schema
 */
const cancelRideSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'changed_my_mind',
      'driver_too_far',
      'found_other_ride',
      'driver_not_responding',
      'incorrect_pickup_location',
      'rider_not_responding',
      'rider_no_show',
      'safety_concern',
      'vehicle_issue',
      'other'
    )
    .optional()
    .messages({
      'any.only': 'Invalid cancellation reason'
    })
});

/**
 * Driver availability validation schema
 */
const driverAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Availability status is required'
    })
});

/**
 * Pagination validation schema
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

/**
 * Ride ID parameter validation schema
 */
const rideIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Ride ID must be a number',
      'number.positive': 'Ride ID must be positive',
      'any.required': 'Ride ID is required'
    })
});

/**
 * Nearby drivers query validation schema
 */
const nearbyDriversSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'any.required': 'Longitude is required'
    }),
  radius: Joi.number()
    .min(0.1)
    .max(50)
    .default(5)
    .messages({
      'number.min': 'Radius must be at least 0.1 miles',
      'number.max': 'Radius cannot exceed 50 miles'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
});

// ==========================================
// VALIDATION MIDDLEWARE FACTORY
// ==========================================

/**
 * Create validation middleware for a schema
 * 
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,       // Return all errors, not just the first
      stripUnknown: true,      // Remove unknown keys
      convert: true            // Convert types if possible
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', { 
        property, 
        errors,
        path: req.path
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: errors
        }
      });
    }

    // Replace request property with validated/cleaned value
    req[property] = value;
    next();
  };
};

// ==========================================
// PRE-BUILT VALIDATION MIDDLEWARE
// ==========================================

/**
 * Validate request ride body
 */
const validateRequestRide = validate(requestRideSchema, 'body');

/**
 * Validate location update body
 */
const validateLocationUpdate = validate(updateLocationSchema, 'body');

/**
 * Validate ride rating body
 */
const validateRating = validate(rateRideSchema, 'body');

/**
 * Validate cancellation body
 */
const validateCancellation = validate(cancelRideSchema, 'body');

/**
 * Validate driver availability body
 */
const validateAvailability = validate(driverAvailabilitySchema, 'body');

/**
 * Validate pagination query params
 */
const validatePagination = validate(paginationSchema, 'query');

/**
 * Validate ride ID param
 */
const validateRideId = validate(rideIdSchema, 'params');

/**
 * Validate nearby drivers query
 */
const validateNearbyDrivers = validate(nearbyDriversSchema, 'query');

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

/**
 * Validate that pickup and dropoff locations are different
 */
const validateDifferentLocations = (req, res, next) => {
  const { pickup, dropoff } = req.body;
  
  if (!pickup || !dropoff) {
    return next();
  }

  // Check if locations are essentially the same (within ~100 meters)
  const latDiff = Math.abs(pickup.latitude - dropoff.latitude);
  const lonDiff = Math.abs(pickup.longitude - dropoff.longitude);
  
  // Approximately 0.001 degrees = ~111 meters
  if (latDiff < 0.001 && lonDiff < 0.001) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Pickup and dropoff locations must be different'
      }
    });
  }

  next();
};

/**
 * Sanitize user input
 * Removes potentially harmful characters from string fields
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS characters
        obj[key] = obj[key]
          .replace(/[<>]/g, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  
  next();
};

module.exports = {
  // Schemas (for custom validation)
  schemas: {
    requestRideSchema,
    updateLocationSchema,
    rateRideSchema,
    cancelRideSchema,
    driverAvailabilitySchema,
    paginationSchema,
    rideIdSchema,
    nearbyDriversSchema,
    locationSchema
  },
  
  // Generic validator factory
  validate,
  
  // Pre-built validators
  validateRequestRide,
  validateLocationUpdate,
  validateRating,
  validateCancellation,
  validateAvailability,
  validatePagination,
  validateRideId,
  validateNearbyDrivers,
  
  // Custom validators
  validateDifferentLocations,
  sanitizeInput
};
