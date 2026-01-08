/**
 * Distance Calculation Utilities
 * 
 * Provides functions for calculating distances between
 * geographic coordinates using the Haversine formula.
 * 
 * @module utils/distance
 */

// Earth's radius in different units
const EARTH_RADIUS = {
  miles: 3959,
  kilometers: 6371,
  meters: 6371000
};

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance between two points using Haversine formula
 * 
 * The Haversine formula determines the great-circle distance
 * between two points on a sphere given their latitudes and longitudes.
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} [unit='miles'] - Unit of measurement ('miles', 'kilometers', 'meters')
 * @returns {number} Distance between points in specified unit
 * 
 * @example
 * const distance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
 * console.log(distance); // ~3.36 miles
 */
const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'miles') => {
  // Get Earth's radius in the specified unit
  const R = EARTH_RADIUS[unit] || EARTH_RADIUS.miles;
  
  // Convert latitude and longitude differences to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  // Convert latitudes to radians
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
};

/**
 * Calculate estimated travel time based on distance
 * 
 * @param {number} distance - Distance in miles
 * @param {number} [avgSpeed=25] - Average speed in mph (default assumes city driving)
 * @returns {number} Estimated time in seconds
 * 
 * @example
 * const time = estimateTravelTime(5); // 5 miles
 * console.log(time); // 720 seconds (12 minutes)
 */
const estimateTravelTime = (distance, avgSpeed = 25) => {
  // Time = Distance / Speed
  // Convert from hours to seconds
  const timeInHours = distance / avgSpeed;
  const timeInSeconds = Math.round(timeInHours * 3600);
  
  return timeInSeconds;
};

/**
 * Calculate bearing between two points
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-359)
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const dLon = toRadians(lon2 - lon1);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = bearing * (180 / Math.PI); // Convert to degrees
  bearing = (bearing + 360) % 360; // Normalize to 0-359
  
  return Math.round(bearing);
};

/**
 * Check if a point is within a radius of another point
 * 
 * @param {number} centerLat - Center point latitude
 * @param {number} centerLon - Center point longitude
 * @param {number} pointLat - Point to check latitude
 * @param {number} pointLon - Point to check longitude
 * @param {number} radius - Radius in miles
 * @returns {boolean} True if point is within radius
 */
const isWithinRadius = (centerLat, centerLon, pointLat, pointLon, radius) => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radius;
};

/**
 * Calculate the bounding box for a given center point and radius
 * Useful for database queries to quickly filter points
 * 
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radius - Radius in miles
 * @returns {Object} Bounding box coordinates
 */
const getBoundingBox = (lat, lon, radius) => {
  // Approximate conversion: 1 degree latitude = ~69 miles
  const latDelta = radius / 69;
  // Longitude varies by latitude: 1 degree longitude = ~69 miles * cos(latitude)
  const lonDelta = radius / (69 * Math.cos(toRadians(lat)));
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta
  };
};

/**
 * Calculate total distance from a series of waypoints
 * 
 * @param {Array<{latitude: number, longitude: number}>} waypoints - Array of coordinates
 * @returns {number} Total distance in miles
 */
const calculateRouteDistance = (waypoints) => {
  if (!waypoints || waypoints.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    
    totalDistance += calculateDistance(
      current.latitude,
      current.longitude,
      next.latitude,
      next.longitude
    );
  }
  
  return Math.round(totalDistance * 100) / 100;
};

/**
 * Format distance for display
 * 
 * @param {number} distance - Distance in miles
 * @returns {string} Formatted distance string
 */
const formatDistance = (distance) => {
  if (distance < 0.1) {
    // Convert to feet for very short distances
    const feet = Math.round(distance * 5280);
    return `${feet} ft`;
  } else if (distance < 1) {
    // Show one decimal place for distances under a mile
    return `${distance.toFixed(1)} mi`;
  } else {
    // Round to whole number for longer distances
    return `${Math.round(distance)} mi`;
  }
};

/**
 * Format duration for display
 * 
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
};

module.exports = {
  calculateDistance,
  estimateTravelTime,
  calculateBearing,
  isWithinRadius,
  getBoundingBox,
  calculateRouteDistance,
  formatDistance,
  formatDuration,
  toRadians,
  EARTH_RADIUS
};
