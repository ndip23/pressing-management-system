// client/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files using the correct relative path
// from client/src/i18n.js, it looks for client/src/locales/...
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationES from './locales/es/translation.json';
import translationHI from './locales/hi/translation.json';
import translationFIL from './locales/fil/translation.json';

// The translations
const resources = {
    en: {
        translation: translationEN
    },
    fr: {
        translation: translationFR
    },
    es: {
        translation: translationES
    },
    hi: {
        translation: translationHI
    },
    fil: {
        translation: translationFIL
    }
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // Init i18next
    .init({
        resources,
        fallbackLng: 'en', // Use English if detected language is not available
        
        detection: {
            // Order and from where user language should be detected
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            // Keys or params to lookup language from
            lookupQuerystring: 'lng',
            lookupCookie: 'i18next',
            lookupLocalStorage: 'i18nextLng',
            
            // Cache user language on
            caches: ['localStorage', 'cookie'],
            excludeCacheFor: ['cimode'], // Languages to not persist
        },
        
        interpolation: {
            escapeValue: false // React already protects from xss
        },

        // Enable debug mode to see what i18next is doing in the console
        debug: process.env.NODE_ENV === 'development',
    });

export default i18n;