import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n from '../i18n';
import { resolveAppLanguage } from '../i18n/resolve-language';
import { mmkvStorage } from './mmkv-storage';

export type AppTheme = 'light' | 'dark' | 'system';

export type SettingsState = {
  theme: AppTheme;
  language: string;
  isOnboardingCompleted: boolean;
};

type SettingsActions = {
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: string) => void;
  setOnboardingCompleted: (isCompleted: boolean) => void;
  resetSettings: () => void;
};

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  theme: 'system',
  language: resolveAppLanguage(),
  isOnboardingCompleted: false,
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
        isOnboardingCompleted: state.isOnboardingCompleted,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { ...currentState, language: resolveAppLanguage() };
        }
        return {
          ...currentState,
          ...(persistedState as Partial<SettingsState>),
          language: resolveAppLanguage(),
        };
      },
    },
  ),
);
