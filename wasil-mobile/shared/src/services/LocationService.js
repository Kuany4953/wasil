/**
 * Wasil Mobile - Location Service
 * GPS tracking and geolocation utilities
 */

import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { LOCATION_CONFIG, JUBA_CENTER } from '../constants';

class LocationService {
  constructor() {
    this.watchId = null;
    this.currentLocation = null;
    this.locationCallbacks = [];
  }

  /**
   * Request location permissions
   * @returns {Promise<boolean>} - Permission granted status
   */
  async requestPermission() {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted' || status === 'whenInUse';
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Wasil needs access to your location to find nearby drivers and track your ride.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Location permission error:', err);
        return false;
      }
    }

    return false;
  }

  /**
   * Request background location permission (for driver app)
   * @returns {Promise<boolean>}
   */
  async requestBackgroundPermission() {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('always');
      return status === 'granted' || status === 'always';
    }

    if (Platform.OS === 'android' && Platform.Version >= 29) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Location Permission',
            message: 'Wasil needs background location access to track your location while driving.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Background location permission error:', err);
        return false;
      }
    }

    return true; // Background location not needed on older Android versions
  }

  /**
   * Check if location services are enabled
   * @returns {Promise<boolean>}
   */
  async isLocationEnabled() {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === 2) {
            // Position unavailable - location services might be off
            resolve(false);
          } else {
            resolve(true);
          }
        },
        { timeout: 5000, maximumAge: 0 }
      );
    });
  }

  /**
   * Open device location settings
   */
  openLocationSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Get current location (one-time)
   * @param {Object} options - Geolocation options
   * @returns {Promise<Object>} - Location {latitude, longitude, accuracy, heading, speed}
   */
  async getCurrentLocation(options = {}) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Get current location error:', error);
          reject(this.handleLocationError(error));
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.HIGH_ACCURACY,
          timeout: options.timeout || LOCATION_CONFIG.TIMEOUT,
          maximumAge: options.maximumAge || LOCATION_CONFIG.MAX_AGE,
          ...options,
        }
      );
    });
  }

  /**
   * Start watching location changes
   * @param {Function} callback - Callback for location updates
   * @param {Object} options - Watch options
   * @returns {number} - Watch ID
   */
  startWatching(callback, options = {}) {
    if (this.watchId !== null) {
      console.log('Already watching location');
      this.locationCallbacks.push(callback);
      return this.watchId;
    }

    this.locationCallbacks = [callback];

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;
        
        // Notify all callbacks
        this.locationCallbacks.forEach((cb) => {
          try {
            cb(location);
          } catch (err) {
            console.error('Location callback error:', err);
          }
        });
      },
      (error) => {
        console.error('Watch location error:', error);
        const locationError = this.handleLocationError(error);
        this.locationCallbacks.forEach((cb) => {
          try {
            cb(null, locationError);
          } catch (err) {
            console.error('Location error callback error:', err);
          }
        });
      },
      {
        enableHighAccuracy: LOCATION_CONFIG.HIGH_ACCURACY,
        distanceFilter: options.distanceFilter || LOCATION_CONFIG.DISTANCE_FILTER,
        interval: options.interval || LOCATION_CONFIG.UPDATE_INTERVAL,
        fastestInterval: options.fastestInterval || LOCATION_CONFIG.UPDATE_INTERVAL / 2,
        ...options,
      }
    );

    console.log('Started watching location, watchId:', this.watchId);
    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatching() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.locationCallbacks = [];
      console.log('Stopped watching location');
    }
  }

  /**
   * Add a callback to location updates
   * @param {Function} callback
   */
  addLocationCallback(callback) {
    if (!this.locationCallbacks.includes(callback)) {
      this.locationCallbacks.push(callback);
    }
  }

  /**
   * Remove a callback from location updates
   * @param {Function} callback
   */
  removeLocationCallback(callback) {
    const index = this.locationCallbacks.indexOf(callback);
    if (index > -1) {
      this.locationCallbacks.splice(index, 1);
    }
  }

  /**
   * Get cached current location
   * @returns {Object|null}
   */
  getCachedLocation() {
    return this.currentLocation;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg
   * @returns {number}
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate bearing between two points
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} - Bearing in degrees (0-360)
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;
    return bearing;
  }

  /**
   * Check if location is within Juba service area
   * @param {Object} location - {latitude, longitude}
   * @returns {boolean}
   */
  isWithinServiceArea(location) {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      JUBA_CENTER.latitude,
      JUBA_CENTER.longitude
    );
    return distance <= 15; // 15km radius
  }

  /**
   * Get ETA based on distance
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} avgSpeedKmh - Average speed in km/h (default: 30 for Juba)
   * @returns {number} - ETA in minutes
   */
  calculateETA(distanceKm, avgSpeedKmh = 30) {
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  }

  /**
   * Format distance for display
   * @param {number} distanceKm - Distance in kilometers
   * @returns {string}
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  /**
   * Format ETA for display
   * @param {number} minutes
   * @returns {string}
   */
  formatETA(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  /**
   * Handle location errors
   * @param {Object} error
   * @returns {Error}
   */
  handleLocationError(error) {
    let message = 'Failed to get location';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        message = 'Location permission denied. Please enable location access in settings.';
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'Location unavailable. Please check your GPS settings.';
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = error.message || 'Unknown location error';
    }
    
    return new Error(message);
  }

  /**
   * Show location error alert with option to open settings
   * @param {Error} error
   */
  showLocationErrorAlert(error) {
    Alert.alert(
      'Location Error',
      error.message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => this.openLocationSettings(),
        },
      ]
    );
  }
}

export default new LocationService();
