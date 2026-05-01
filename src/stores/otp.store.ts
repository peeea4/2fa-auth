import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { OtpEntry } from '../types';
import { mmkvStorage } from './mmkv-storage';

type OtpStoreState = {
  entries: OtpEntry[];
};

type OtpStoreActions = {
  setEntries: (entries: OtpEntry[]) => void;
  upsertEntry: (entry: OtpEntry) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
};

type OtpStore = OtpStoreState & OtpStoreActions;

const initialState: OtpStoreState = {
  entries: [],
};

export const useOtpStore = create<OtpStore>()(
  persist(
    (set) => ({
      ...initialState,
      setEntries: (entries) => {
        set({ entries });
      },
      upsertEntry: (entry) => {
        set((state) => {
          const existingEntryIndex = state.entries.findIndex((item) => item.id === entry.id);
          if (existingEntryIndex < 0) {
            return {
              entries: [...state.entries, entry],
            };
          }

          const nextEntries = [...state.entries];
          nextEntries[existingEntryIndex] = entry;

          return {
            entries: nextEntries,
          };
        });
      },
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },
      clearEntries: () => {
        set({ entries: [] });
      },
    }),
    {
      name: 'otp.store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

