import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';

const localeLoaders = {
  en: () => Promise.resolve({ default: translationEN }),
  fr: () => import('./locales/fr/translation.json'),
  es: () => import('./locales/es/translation.json'),
  hi: () => import('./locales/hi/translation.json'),
  fil: () => import('./locales/fil/translation.json'),
};

const loadLanguage = async (lng) => {
  const language = localeLoaders[lng] ? lng : 'en';
  if (i18n.hasResourceBundle(language, 'translation')) return;

  const loader = localeLoaders[language] || localeLoaders.en;
  const mod = await loader();
  const bundle = mod.default || mod;
  i18n.addResourceBundle(language, 'translation', bundle, true, true);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'es', 'hi', 'fil'],
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
      excludeCacheFor: ['cimode'],
    },
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === 'development',
  });

i18n.on('languageChanged', (lng) => {
  loadLanguage(lng);
});

loadLanguage(i18n.language || 'en');

export default i18n;
