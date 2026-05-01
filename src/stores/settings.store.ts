import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  language: 'en',
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
      },
      setOnboardingCompleted: (isCompleted) => {
        set({ isOnboardingCompleted: isCompleted });
      },
      resetSettings: () => {
        set(initialState);
      },
    }),
    {
      name: 'settings.store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

