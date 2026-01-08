/**
 * Wasil Mobile - i18n Configuration
 * Internationalization setup for 5 languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LANGUAGES } from '../constants';

// Import language files
import en from './en.json';
import ar from './ar.json';

// Note: Dinka (din), Nuer (nue), and Bari (bri) translations
// should be added by native speakers. For now, we'll use English as fallback.
// These files would be imported when translations are available:
// import din from './din.json';
// import nue from './nue.json';
// import bri from './bri.json';

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
    } catch (error) {
      console.error('Error detecting language:', error);
    }
    callback('en'); // Default to English
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

// Resources (translations)
const resources = {
  en: { translation: en },
  ar: { translation: ar },
  // Placeholder for local languages - using English until translations are available
  din: { translation: en }, // Dinka
  nue: { translation: en }, // Nuer
  bri: { translation: en }, // Bari
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: Object.keys(LANGUAGES).map(key => LANGUAGES[key].code),
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    
    // Debug mode in development
    debug: __DEV__,
  });

/**
 * Change the app language
 * @param {string} languageCode - Language code (en, ar, din, nue, bri)
 */
export const changeLanguage = async (languageCode) => {
  await i18n.changeLanguage(languageCode);
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
};

/**
 * Get current language code
 * @returns {string} - Current language code
 */
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

/**
 * Get language info
 * @param {string} code - Language code
 * @returns {Object} - Language info (name, native, rtl)
 */
export const getLanguageInfo = (code) => {
  const langKey = Object.keys(LANGUAGES).find(
    key => LANGUAGES[key].code === code
  );
  return langKey ? LANGUAGES[langKey] : LANGUAGES.EN;
};

/**
 * Check if current language is RTL (Arabic)
 * @returns {boolean}
 */
export const isRTL = () => {
  const currentLang = getCurrentLanguage();
  const langInfo = getLanguageInfo(currentLang);
  return langInfo?.rtl || false;
};

/**
 * Get all supported languages
 * @returns {Array} - Array of language objects
 */
export const getSupportedLanguages = () => {
  return Object.values(LANGUAGES);
};

export default i18n;
