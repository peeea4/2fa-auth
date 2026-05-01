import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './mmkv-storage';

export type AuthStoreState = {
  isLocked: boolean;
  isPinSet: boolean;
  isBiometricEnabled: boolean;
  failedAttempts: number;
};

type AuthStoreActions = {
  lock: () => void;
  unlock: () => void;
  setPinSet: (isPinSet: boolean) => void;
  setBiometricEnabled: (isEnabled: boolean) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  resetAuthState: () => void;
};

type AuthStore = AuthStoreState & AuthStoreActions;

const initialState: AuthStoreState = {
  isLocked: true,
  isPinSet: false,
  isBiometricEnabled: false,
  failedAttempts: 0,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      lock: () => {
        set({ isLocked: true });
      },
      unlock: () => {
        set({ isLocked: false, failedAttempts: 0 });
      },
      setPinSet: (isPinSet) => {
        set({ isPinSet });
      },
      setBiometricEnabled: (isEnabled) => {
        set({ isBiometricEnabled: isEnabled });
      },
      incrementFailedAttempts: () => {
        set((state) => ({ failedAttempts: state.failedAttempts + 1 }));
      },
      resetFailedAttempts: () => {
        set({ failedAttempts: 0 });
      },
      resetAuthState: () => {
        set(initialState);
      },
    }),
    {
      name: 'auth.store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

