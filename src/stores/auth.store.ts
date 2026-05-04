import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './mmkv-storage';

export type AuthStoreState = {
  isLocked: boolean;
  /** Premium: при уходе в фон блокировать и разблокировать через системный LocalAuthentication. */
  isBiometricEnabled: boolean;
};

type AuthStoreActions = {
  lock: () => void;
  unlock: () => void;
  setBiometricEnabled: (isEnabled: boolean) => void;
  resetAuthState: () => void;
};

type AuthStore = AuthStoreState & AuthStoreActions;

const initialState: AuthStoreState = {
  isLocked: false,
  isBiometricEnabled: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      lock: () => {
        set({ isLocked: true });
      },
      unlock: () => {
        set({ isLocked: false });
      },
      setBiometricEnabled: (isEnabled) => {
        set({ isBiometricEnabled: isEnabled });
      },
      resetAuthState: () => {
        set(initialState);
      },
    }),
    {
      name: 'auth.store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        isLocked: state.isLocked,
        isBiometricEnabled: state.isBiometricEnabled,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') {
          return current;
        }
        const p = persisted as Partial<AuthStoreState>;
        return {
          ...current,
          isLocked: typeof p.isLocked === 'boolean' ? p.isLocked : current.isLocked,
          isBiometricEnabled:
            typeof p.isBiometricEnabled === 'boolean' ? p.isBiometricEnabled : current.isBiometricEnabled,
        };
      },
    },
  ),
);
