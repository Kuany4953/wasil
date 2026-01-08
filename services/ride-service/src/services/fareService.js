/**
 * Fare Calculation Service
 * 
 * Handles all fare-related calculations for rides.
 * Customized for Wasil - Juba, South Sudan
 * 
 * @module services/fareService
 */

const logger = require('../utils/logger');
const { 
  FARE_CONFIG, 
  RIDE_TYPE_MULTIPLIERS,
  RIDE_TYPES,
  RIDE_TYPE_CONFIG,
  CURRENCY_CONFIG,
  SURGE_TIMES,
  ROAD_CONDITIONS,
  JUBA_GEO
} = require('../utils/constants');
const { calculateDistance, estimateTravelTime } = require('../utils/distance');

/**
 * Fare calculation breakdown
 * @typedef {Object} FareBreakdown
 * @property {number} baseFare - Base fare amount
 * @property {number} distanceFare - Distance-based fare
 * @property {number} timeFare - Time-based fare
 * @property {number} subtotal - Sum before multipliers
 * @property {number} rideTypeMultiplier - Multiplier for ride type
 * @property {number} surgeMultiplier - Surge pricing multiplier
 * @property {number} seasonalMultiplier - Seasonal adjustment multiplier
 * @property {number} roadConditionMultiplier - Road condition multiplier
 * @property {number} nightFee - Night safety fee if applicable
 * @property {number} totalFare - Final calculated fare
 * @property {string} currency - Currency code (SSP)
 */

class FareService {
  /**
   * Get current seasonal multiplier based on month
   * Rainy season (April-October) has higher fares due to road conditions
   * 
   * @returns {number} Seasonal multiplier
   */
  static getSeasonalMultiplier() {
    const month = new Date().getMonth() + 1;  // 1-12
    if (ROAD_CONDITIONS.RAINY_SEASON.months.includes(month)) {
      logger.debug('Rainy season multiplier applied', { month });
      return ROAD_CONDITIONS.RAINY_SEASON.multiplier;
    }
    return 1.0;
  }

  /**
   * Get current surge multiplier based on time of day
   * 
   * @returns {{multiplier: number, safetyFee: number}} Surge info
   */
  static getTimeSurgeMultiplier() {
    const hour = new Date().getHours();
    
    // Check morning rush
    if (SURGE_TIMES.MORNING_RUSH.hours.includes(hour)) {
      return { multiplier: SURGE_TIMES.MORNING_RUSH.multiplier, safetyFee: 0 };
    }
    
    // Check evening rush
    if (SURGE_TIMES.EVENING_RUSH.hours.includes(hour)) {
      return { multiplier: SURGE_TIMES.EVENING_RUSH.multiplier, safetyFee: 0 };
    }
    
    // Check night hours
    if (SURGE_TIMES.NIGHT.hours.includes(hour)) {
      return { 
        multiplier: SURGE_TIMES.NIGHT.multiplier, 
        safetyFee: SURGE_TIMES.NIGHT.safetyFee 
      };
    }
    
    return { multiplier: 1.0, safetyFee: 0 };
  }

  /**
   * Get zone multiplier based on location
   * 
   * @param {Object} location - {latitude, longitude}
   * @returns {number} Zone fare multiplier
   */
  static getZoneMultiplier(location) {
    // Calculate distance from Juba center
    const distanceFromCenter = calculateDistance(
      location.latitude,
      location.longitude,
      JUBA_GEO.CENTER.latitude,
      JUBA_GEO.CENTER.longitude
    );
    
    // In km (convert from miles)
    const distanceKm = distanceFromCenter * 1.60934;
    
    if (distanceKm <= 3) {
      return JUBA_GEO.ZONES.CENTER.baseFareMultiplier;
    } else if (distanceKm <= 8) {
      return JUBA_GEO.ZONES.RESIDENTIAL.baseFareMultiplier;
    } else {
      return JUBA_GEO.ZONES.OUTER.baseFareMultiplier;
    }
  }

  /**
   * Calculate estimated fare before ride starts
   * 
   * @param {Object} params - Fare calculation parameters
   * @param {number} params.distance - Estimated distance in km
   * @param {number} params.duration - Estimated duration in seconds
   * @param {string} params.rideType - Type of ride (boda_boda, standard, premium)
   * @param {number} [params.surgeMultiplier=1.0] - Manual surge pricing multiplier
   * @param {string} [params.roadCondition='paved'] - Road condition type
   * @returns {FareBreakdown} Fare breakdown
   * 
   * @example
   * const fare = FareService.calculateEstimatedFare({
   *   distance: 5.2,
   *   duration: 900,
   *   rideType: 'standard',
   *   surgeMultiplier: 1.5
   * });
   */
  static calculateEstimatedFare({ 
    distance, 
    duration, 
    rideType = 'standard', 
    surgeMultiplier = null,
    roadCondition = 'paved'
  }) {
    logger.debug('Calculating estimated fare', { distance, duration, rideType, roadCondition });

    // Get base fare
    const baseFare = FARE_CONFIG.BASE_FARE;
    const minimumFare = FARE_CONFIG.MINIMUM_FARE;

    // Get per-km and per-minute rates for ride type
    const costPerKm = FARE_CONFIG.COST_PER_KM[rideType] || FARE_CONFIG.COST_PER_KM[RIDE_TYPES.STANDARD];
    const costPerMinute = FARE_CONFIG.COST_PER_MINUTE[rideType] || FARE_CONFIG.COST_PER_MINUTE[RIDE_TYPES.STANDARD];

    // Calculate component fares
    const distanceFare = distance * costPerKm;
    const timeFare = (duration / 60) * costPerMinute;  // Convert seconds to minutes

    // Get ride type multiplier
    const rideTypeMultiplier = RIDE_TYPE_MULTIPLIERS[rideType] || 1.0;

    // Get time-based surge (if not manually provided)
    const timeSurge = this.getTimeSurgeMultiplier();
    const effectiveSurgeMultiplier = surgeMultiplier !== null ? surgeMultiplier : timeSurge.multiplier;
    const nightFee = timeSurge.safetyFee;

    // Get seasonal multiplier
    const seasonalMultiplier = this.getSeasonalMultiplier();

    // Get road condition multiplier
    const roadMultiplier = ROAD_CONDITIONS[roadCondition.toUpperCase()]?.multiplier || 1.0;

    // Calculate subtotal (before multipliers)
    const subtotal = baseFare + distanceFare + timeFare;

    // Apply all multipliers
    let totalFare = subtotal * rideTypeMultiplier * effectiveSurgeMultiplier * seasonalMultiplier * roadMultiplier;

    // Add night safety fee if applicable
    totalFare += nightFee;

    // Add booking fee
    totalFare += FARE_CONFIG.BOOKING_FEE;

    // Ensure minimum fare
    totalFare = Math.max(totalFare, minimumFare);

    // Round to nearest whole number (no decimals for SSP)
    const roundedFare = Math.round(totalFare);

    const breakdown = {
      baseFare: Math.round(baseFare),
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      bookingFee: Math.round(FARE_CONFIG.BOOKING_FEE),
      subtotal: Math.round(subtotal),
      rideTypeMultiplier,
      surgeMultiplier: effectiveSurgeMultiplier,
      seasonalMultiplier,
      roadConditionMultiplier: roadMultiplier,
      nightFee,
      totalFare: roundedFare,
      currency: CURRENCY_CONFIG.CODE
    };

    logger.debug('Estimated fare calculated', breakdown);
    return breakdown;
  }

  /**
   * Calculate actual fare after ride completion
   * 
   * @param {Object} params - Fare calculation parameters
   * @param {number} params.actualDistance - Actual distance traveled in km
   * @param {number} params.actualDuration - Actual duration in seconds
   * @param {string} params.rideType - Type of ride
   * @param {number} [params.surgeMultiplier=1.0] - Surge pricing multiplier
   * @param {string} [params.roadCondition='paved'] - Road condition
   * @param {Object} [params.adjustments] - Manual adjustments
   * @returns {FareBreakdown} Final fare breakdown
   */
  static calculateActualFare({ 
    actualDistance, 
    actualDuration, 
    rideType = 'standard', 
    surgeMultiplier = 1.0, 
    roadCondition = 'paved',
    adjustments = {} 
  }) {
    logger.debug('Calculating actual fare', { actualDistance, actualDuration, rideType });

    // Use same calculation as estimated
    const breakdown = this.calculateEstimatedFare({
      distance: actualDistance,
      duration: actualDuration,
      rideType,
      surgeMultiplier,
      roadCondition
    });

    // Apply any adjustments
    let adjustedFare = breakdown.totalFare;
    
    if (adjustments.discount) {
      adjustedFare -= adjustments.discount;
    }
    
    if (adjustments.tollFees) {
      adjustedFare += adjustments.tollFees;
    }

    if (adjustments.waitingFee) {
      adjustedFare += adjustments.waitingFee;
    }

    if (adjustments.tip) {
      adjustedFare += adjustments.tip;
    }

    // Ensure minimum fare
    adjustedFare = Math.max(adjustedFare, FARE_CONFIG.MINIMUM_FARE);
    
    breakdown.totalFare = Math.round(adjustedFare);
    breakdown.adjustments = adjustments;

    logger.info('Actual fare calculated', { rideType, totalFare: breakdown.totalFare });
    return breakdown;
  }

  /**
   * Calculate fare estimate for a route
   * 
   * @param {Object} pickup - Pickup location {latitude, longitude}
   * @param {Object} dropoff - Dropoff location {latitude, longitude}
   * @param {string} rideType - Type of ride
   * @returns {Object} Fare estimate with all ride types
   */
  static calculateFareEstimate(pickup, dropoff, rideType = 'standard') {
    // Calculate distance between points (returns miles)
    const distanceMiles = calculateDistance(
      pickup.latitude,
      pickup.longitude,
      dropoff.latitude,
      dropoff.longitude
    );

    // Convert to km for Juba pricing
    const distanceKm = distanceMiles * 1.60934;

    // Estimate duration based on distance
    const duration = estimateTravelTime(distanceMiles);

    // Get zone multiplier for pickup location
    const zoneMultiplier = this.getZoneMultiplier(pickup);

    // Get time-based surge multiplier
    const surgeInfo = this.getTimeSurgeMultiplier();

    // Calculate fare for requested ride type
    const fareBreakdown = this.calculateEstimatedFare({
      distance: distanceKm,
      duration,
      rideType,
      surgeMultiplier: surgeInfo.multiplier * zoneMultiplier
    });

    // Calculate for all ride types for comparison
    const allFares = {};
    for (const type of Object.keys(RIDE_TYPE_MULTIPLIERS)) {
      const fare = this.calculateEstimatedFare({
        distance: distanceKm,
        duration,
        rideType: type,
        surgeMultiplier: surgeInfo.multiplier * zoneMultiplier
      });
      allFares[type] = {
        fare: fare.totalFare,
        formatted: this.formatFare(fare.totalFare),
        breakdown: fare,
        rideInfo: RIDE_TYPE_CONFIG[type]
      };
    }

    return {
      distance: distanceKm,
      distanceFormatted: `${distanceKm.toFixed(1)} km`,
      duration,
      durationFormatted: this.formatDuration(duration),
      surgeMultiplier: surgeInfo.multiplier,
      zoneMultiplier,
      estimatedFare: fareBreakdown.totalFare,
      estimatedFareFormatted: this.formatFare(fareBreakdown.totalFare),
      fareBreakdown,
      allRideTypes: allFares,
      currency: CURRENCY_CONFIG.CODE
    };
  }

  /**
   * Get current surge multiplier for a location
   * Combines time, zone, and demand-based surges
   * 
   * @param {Object} location - Location {latitude, longitude}
   * @returns {number} Combined surge multiplier (1.0 = no surge)
   */
  static getCurrentSurgeMultiplier(location) {
    const timeSurge = this.getTimeSurgeMultiplier();
    const zoneSurge = this.getZoneMultiplier(location);
    const seasonalSurge = this.getSeasonalMultiplier();
    
    // Combine multipliers (capped at max)
    let combinedSurge = timeSurge.multiplier * zoneSurge * seasonalSurge;
    combinedSurge = Math.min(combinedSurge, FARE_CONFIG.MAX_SURGE_MULTIPLIER);
    
    return Math.round(combinedSurge * 100) / 100;
  }

  /**
   * Calculate cancellation fee
   * 
   * @param {Object} ride - Ride object
   * @param {string} cancelledBy - Who cancelled ('rider', 'driver')
   * @returns {number} Cancellation fee amount in SSP
   */
  static calculateCancellationFee(ride, cancelledBy) {
    // No fee if cancelled immediately (within 2 minutes)
    const timeSinceRequest = new Date() - new Date(ride.requestedAt);
    const freeWindowMs = 2 * 60 * 1000;  // 2 minutes

    if (timeSinceRequest <= freeWindowMs) {
      logger.info('Free cancellation (within window)', { rideId: ride.id });
      return 0;
    }

    // No fee if driver cancelled after acceptance
    if (cancelledBy === 'driver' && ride.status !== 'requested') {
      logger.info('No fee for driver cancellation after acceptance', { rideId: ride.id });
      return 0;
    }

    // Rider cancellation fee after driver accepted
    if (cancelledBy === 'rider' && ride.driverId) {
      logger.info('Cancellation fee applied', { rideId: ride.id, fee: FARE_CONFIG.CANCELLATION_FEE });
      return FARE_CONFIG.CANCELLATION_FEE;
    }

    return 0;
  }

  /**
   * Format fare for display with currency
   * 
   * @param {number} amount - Fare amount
   * @param {string} currency - Currency code (default: SSP)
   * @returns {string} Formatted fare string
   */
  static formatFare(amount, currency = CURRENCY_CONFIG.CODE) {
    // For SSP, no decimal places
    const roundedAmount = Math.round(amount);
    return `${roundedAmount.toLocaleString()} ${currency}`;
  }

  /**
   * Format duration for display
   * 
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  static formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `~${hours}h ${remainingMins}min`;
  }

  /**
   * Get fare range estimate (low to high)
   * 
   * @param {Object} pickup - Pickup location
   * @param {Object} dropoff - Dropoff location
   * @param {string} rideType - Type of ride
   * @returns {Object} Low and high fare estimates
   */
  static getFareRange(pickup, dropoff, rideType = 'standard') {
    const estimate = this.calculateFareEstimate(pickup, dropoff, rideType);
    
    // Calculate range as +/- 15% of estimate
    const variance = 0.15;
    const low = Math.round(estimate.estimatedFare * (1 - variance));
    const high = Math.round(estimate.estimatedFare * (1 + variance));

    return {
      low,
      high,
      estimate: estimate.estimatedFare,
      formatted: {
        low: this.formatFare(low),
        high: this.formatFare(high),
        range: `${this.formatFare(low)} - ${this.formatFare(high)}`
      },
      currency: CURRENCY_CONFIG.CODE
    };
  }

  /**
   * Calculate waiting time fee
   * 
   * @param {number} waitingMinutes - Minutes waited beyond grace period
   * @returns {number} Waiting fee amount in SSP
   */
  static calculateWaitingFee(waitingMinutes) {
    const gracePeriod = FARE_CONFIG.WAITING_GRACE_PERIOD_MINUTES;
    const ratePerMinute = FARE_CONFIG.WAITING_FEE_PER_MINUTE;

    if (waitingMinutes <= gracePeriod) {
      return 0;
    }

    const chargeableMinutes = waitingMinutes - gracePeriod;
    return Math.round(chargeableMinutes * ratePerMinute);
  }

  /**
   * Calculate driver earnings from a ride
   * Driver gets 80% of the fare (standard Wasil commission is 20%)
   * 
   * @param {number} totalFare - Total fare amount
   * @param {number} [commissionRate=0.20] - Wasil commission rate
   * @returns {Object} Driver earnings breakdown
   */
  static calculateDriverEarnings(totalFare, commissionRate = 0.20) {
    const commission = Math.round(totalFare * commissionRate);
    const driverEarnings = totalFare - commission;
    
    return {
      totalFare,
      commission,
      commissionRate: commissionRate * 100,  // As percentage
      driverEarnings,
      formatted: {
        totalFare: this.formatFare(totalFare),
        commission: this.formatFare(commission),
        driverEarnings: this.formatFare(driverEarnings)
      },
      currency: CURRENCY_CONFIG.CODE
    };
  }

  /**
   * Convert fare from SSP to USD
   * 
   * @param {number} amountSSP - Amount in SSP
   * @returns {Object} Converted amount
   */
  static convertToUSD(amountSSP) {
    const usdAmount = amountSSP / CURRENCY_CONFIG.USD_RATE;
    return {
      ssp: amountSSP,
      usd: Math.round(usdAmount * 100) / 100,
      rate: CURRENCY_CONFIG.USD_RATE,
      formatted: {
        ssp: this.formatFare(amountSSP, 'SSP'),
        usd: `$${usdAmount.toFixed(2)} USD`
      }
    };
  }

  /**
   * Get fare summary for receipt
   * 
   * @param {Object} ride - Completed ride object
   * @returns {Object} Receipt-ready fare summary
   */
  static generateFareReceipt(ride) {
    const earnings = this.calculateDriverEarnings(ride.actualFare || ride.estimatedFare);
    const usdConversion = this.convertToUSD(ride.actualFare || ride.estimatedFare);
    
    return {
      rideId: ride.uuid || ride.id,
      date: new Date().toISOString(),
      pickup: ride.pickupAddress,
      dropoff: ride.dropoffAddress,
      rideType: ride.rideType,
      distance: ride.actualDistance || ride.estimatedDistance,
      duration: ride.actualDuration || ride.estimatedDuration,
      fareBreakdown: {
        baseFare: FARE_CONFIG.BASE_FARE,
        distanceFare: ride.distanceFare,
        timeFare: ride.timeFare,
        surgeMultiplier: ride.surgeMultiplier,
        totalFare: ride.actualFare || ride.estimatedFare
      },
      driverEarnings: earnings,
      currency: CURRENCY_CONFIG.CODE,
      usdEquivalent: usdConversion.usd
    };
  }
}

module.exports = FareService;
