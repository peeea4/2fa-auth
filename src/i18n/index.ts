import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import { resolveAppLanguage, SUPPORTED_LANGUAGES } from './resolve-language';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
    },
    lng: resolveAppLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;

export { resolveAppLanguage, SUPPORTED_LANGUAGES } from './resolve-language';
