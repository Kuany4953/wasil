/**
 * Wasil Mobile - Authentication Service
 * Handles user authentication with phone number and OTP
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { post, get } from '../api/client';
import { STORAGE_KEYS } from '../constants';

class AuthService {
  /**
   * Request OTP for phone number verification
   * @param {string} phoneNumber - Phone number with country code (+211...)
   * @returns {Promise<Object>} - Response with verification ID
   */
  async requestOTP(phoneNumber) {
    try {
      const response = await post('/auth/send-otp', {
        phone: phoneNumber,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP and login/register user
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} otp - One-time password
   * @param {string} userType - 'rider' or 'driver'
   * @returns {Promise<Object>} - User data with token
   */
  async verifyOTP(phoneNumber, otp, userType = 'rider') {
    try {
      const response = await post('/auth/verify-otp', {
        phone: phoneNumber,
        otp,
        userType,
      });

      const { token, refreshToken, user } = response.data;

      // Store auth tokens and user data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        ['@wasil_refresh_token', refreshToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);

      return { token, user };
    } catch (error) {
      throw new Error(error.message || 'OTP verification failed');
    }
  }

  /**
   * Complete user profile setup
   * @param {Object} profileData - User profile data
   * @returns {Promise<Object>} - Updated user data
   */
  async completeProfile(profileData) {
    try {
      const response = await post('/auth/complete-profile', profileData);
      
      // Update stored user data
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data.user)
      );

      return response.data.user;
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Get current user data
   * @returns {Promise<Object|null>} - User data or null
   */
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh user profile from server
   * @returns {Promise<Object>} - Updated user data
   */
  async refreshProfile() {
    try {
      const response = await get('/auth/me');
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data.user)
      );

      return response.data.user;
    } catch (error) {
      throw new Error(error.message || 'Failed to refresh profile');
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user data
   */
  async updateProfile(updates) {
    try {
      const response = await post('/auth/update-profile', updates);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data.user)
      );

      return response.data.user;
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Upload profile photo
   * @param {Object} photo - Photo object with uri, type, name
   * @returns {Promise<string>} - Photo URL
   */
  async uploadProfilePhoto(photo) {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.name || 'profile.jpg',
      });

      const response = await apiClient.post('/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.photoUrl;
    } catch (error) {
      throw new Error(error.message || 'Failed to upload photo');
    }
  }

  /**
   * Update user's preferred language
   * @param {string} languageCode - Language code (en, ar, din, nue, bri)
   * @returns {Promise<void>}
   */
  async setLanguage(languageCode) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
      
      // Also update on server if authenticated
      const isAuth = await this.isAuthenticated();
      if (isAuth) {
        await post('/auth/update-language', { language: languageCode });
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  /**
   * Get user's preferred language
   * @returns {Promise<string>} - Language code
   */
  async getLanguage() {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return language || 'en';
    } catch (error) {
      return 'en';
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Call logout endpoint to invalidate token
      await post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    }

    // Clear all stored auth data
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      '@wasil_refresh_token',
    ]);
  }

  /**
   * Delete user account
   * @returns {Promise<void>}
   */
  async deleteAccount() {
    try {
      await post('/auth/delete-account');
      await this.logout();
    } catch (error) {
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  /**
   * Register FCM token for push notifications
   * @param {string} fcmToken - Firebase Cloud Messaging token
   * @returns {Promise<void>}
   */
  async registerFCMToken(fcmToken) {
    try {
      await post('/auth/register-fcm-token', { fcmToken });
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  /**
   * Check if onboarding is complete
   * @returns {Promise<boolean>}
   */
  async isOnboardingComplete() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark onboarding as complete
   * @returns {Promise<void>}
   */
  async completeOnboarding() {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  }
}

export default new AuthService();
