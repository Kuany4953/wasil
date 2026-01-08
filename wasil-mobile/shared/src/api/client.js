/**
 * Wasil Mobile - API Client
 * Axios-based HTTP client for API communication
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };
      
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('[API] Request interceptor error:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and refresh tokens
apiClient.interceptors.response.use(
  (response) => {
    // Log response time
    const duration = new Date() - response.config.metadata?.startTime;
    console.log(`[API] Response ${response.status} (${duration}ms)`);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('[API] Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message,
    });
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('@wasil_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { token } = response.data;
          await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER_DATA,
          '@wasil_refresh_token',
        ]);
        
        // Emit logout event (will be handled by auth context)
        if (apiClient.onUnauthorized) {
          apiClient.onUnauthorized();
        }
      }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }
    
    // Handle specific error codes
    if (error.response) {
      switch (error.response.status) {
        case 400:
          error.message = error.response.data?.message || 'Invalid request';
          break;
        case 403:
          error.message = 'Access denied';
          break;
        case 404:
          error.message = 'Resource not found';
          break;
        case 429:
          error.message = 'Too many requests. Please try again later.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = error.response.data?.message || 'An error occurred';
      }
    }
    
    return Promise.reject(error);
  }
);

// Set unauthorized callback
export const setUnauthorizedCallback = (callback) => {
  apiClient.onUnauthorized = callback;
};

// Helper methods
export const get = (url, params = {}, config = {}) => {
  return apiClient.get(url, { params, ...config });
};

export const post = (url, data = {}, config = {}) => {
  return apiClient.post(url, data, config);
};

export const put = (url, data = {}, config = {}) => {
  return apiClient.put(url, data, config);
};

export const patch = (url, data = {}, config = {}) => {
  return apiClient.patch(url, data, config);
};

export const del = (url, config = {}) => {
  return apiClient.delete(url, config);
};

// Upload file helper
export const uploadFile = async (url, file, fieldName = 'file', additionalData = {}) => {
  const formData = new FormData();
  
  formData.append(fieldName, {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.name || 'upload.jpg',
  });
  
  // Add additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });
  
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
