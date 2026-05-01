import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PremiumState } from '../types/adapty.types';
import { mmkvStorage } from './mmkv-storage';

type PremiumStoreActions = {
  setPremium: (payload: PremiumState) => void;
  activatePremium: (productId: string, expiresAt?: number | null) => void;
  resetPremium: () => void;
};

type PremiumStore = PremiumState & PremiumStoreActions;

const initialState: PremiumState = {
  isPremium: false,
  expiresAt: null,
  productId: null,
};

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPremium: (payload) => {
        set(payload);
      },
      activatePremium: (productId, expiresAt = null) => {
        set({
          isPremium: true,
          productId,
          expiresAt,
        });
      },
      resetPremium: () => {
        set(initialState);
      },
    }),
    {
      name: 'premium.store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

