/**
 * Wasil Mobile - Shared Package
 * Export all shared utilities, services, and constants
 */

// API
export { default as apiClient, get, post, put, patch, del, uploadFile, setUnauthorizedCallback } from './api/client';

// Services
export { default as AuthService } from './services/AuthService';
export { default as SocketService } from './services/SocketService';
export { default as LocationService } from './services/LocationService';
export { default as RideService } from './services/RideService';

// Constants
export * from './constants';

// Theme
export { default as theme, darkTheme, colors, typography, spacing, borderRadius, shadows, componentStyles } from './theme';

// Localization
export { default as i18n, changeLanguage, getCurrentLanguage, getLanguageInfo, isRTL, getSupportedLanguages } from './locales/i18n';
