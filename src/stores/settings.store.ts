import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AppTheme } from '../constants/colors';
import i18n from '../i18n';
import { resolveAppLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/resolve-language';
import { mmkvStorage } from './mmkv-storage';

export type { AppTheme } from '../constants/colors';

export type SettingsState = {
  theme: AppTheme;
  language: string;
  isOnboardingCompleted: boolean;
  /** Только в `__DEV__`: в продакшене игнорируется в логике Premium. */
  devPremiumOverride: boolean;
};

type SettingsActions = {
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: string) => void;
  setOnboardingCompleted: (isCompleted: boolean) => void;
  setDevPremiumOverride: (value: boolean) => void;
  resetSettings: () => void;
};

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  theme: 'system',
  language: resolveAppLanguage(),
  isOnboardingCompleted: false,
  devPremiumOverride: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => {
        set({ theme });
      },
      setLanguage: (language) => {
        set({ language });
        void i18n.changeLanguage(language);
      },
      setOnboardingCompleted: (isCompleted) => {
        set({ isOnboardingCompleted: isCompleted });
      },
      setDevPremiumOverride: (value) => {
        set({ devPremiumOverride: value });
      },
      resetSettings: () => {
        set({ ...initialState, language: resolveAppLanguage() });
        void i18n.changeLanguage(resolveAppLanguage());
      },
    }),
    {
      name: 'settings.store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        isOnboardingCompleted: state.isOnboardingCompleted,
        devPremiumOverride: state.devPremiumOverride,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { ...currentState, language: resolveAppLanguage() };
        }
        const partial = persistedState as Partial<SettingsState>;
        const persistedLanguage = partial.language;
        const language: SupportedLanguage =
          typeof persistedLanguage === 'string' &&
          SUPPORTED_LANGUAGES.includes(persistedLanguage as SupportedLanguage)
            ? (persistedLanguage as SupportedLanguage)
            : resolveAppLanguage();
        return {
          ...currentState,
          ...partial,
          language,
        };
      },
    },
  ),
);
