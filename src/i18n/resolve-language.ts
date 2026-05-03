import { getLocales } from 'expo-localization';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ru'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Язык интерфейса: код системы, если он в списке поддерживаемых, иначе `en`. */
export function resolveAppLanguage(): SupportedLanguage {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();

  if (
    languageCode &&
    SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage)
  ) {
    return languageCode as SupportedLanguage;
  }

  return 'en';
}
