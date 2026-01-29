//frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '../locales/en/translation.json';
import taTranslation from '../locales/ta/translation.json';
import hiTranslation from '../locales/hi/translation.json';

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ta: {
        translation: taTranslation
      },
      hi: {
        translation: hiTranslation
      }
    },
    // Fallback language
    fallbackLng: 'en',
    // Supported languages
    supportedLngs: ['en', 'ta', 'hi'],
    // Debug mode (set to false in production)
    debug: false,
    // Interpolation settings
    interpolation: {
      escapeValue: false // React already escapes values
    },
    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;