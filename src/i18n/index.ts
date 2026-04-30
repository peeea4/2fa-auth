import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ru'] as const;

const getDeviceLanguage = (): string => {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();

  if (
    languageCode &&
    SUPPORTED_LANGUAGES.includes(languageCode as (typeof SUPPORTED_LANGUAGES)[number])
  ) {
    return languageCode;
  }

  return 'en';
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
    },
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export default i18n;

