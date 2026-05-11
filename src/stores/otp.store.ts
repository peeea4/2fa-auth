import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { OtpEntry } from '../types';
import { mmkvStorage } from './mmkv-storage';

type OtpStoreState = {
  entries: OtpEntry[];
};

type OtpStoreActions = {
  setEntries: (entries: OtpEntry[]) => void;
  reorderEntries: (entries: OtpEntry[]) => void;
  upsertEntry: (entry: OtpEntry) => void;
  incrementHotpCounter: (id: string) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
};

type OtpStore = OtpStoreState & OtpStoreActions;

const initialState: OtpStoreState = {
  entries: [],
};

const withOtpDefaults = (entry: OtpEntry): OtpEntry => ({
  ...entry,
  type: 'totp',
  period: 30,
  counter: undefined,
});

export const useOtpStore = create<OtpStore>()(
  persist(
    (set) => ({
      ...initialState,
      setEntries: (entries) => {
        set({ entries: entries.map(withOtpDefaults) });
      },
      reorderEntries: (entries) => {
        set({ entries: entries.map(withOtpDefaults) });
      },
      upsertEntry: (entry) => {
        const normalizedEntry = withOtpDefaults(entry);
        set((state) => {
          const existingEntryIndex = state.entries.findIndex((item) => item.id === normalizedEntry.id);
          if (existingEntryIndex < 0) {
            return {
              entries: [...state.entries, normalizedEntry],
            };
          }

          const nextEntries = [...state.entries];
          nextEntries[existingEntryIndex] = normalizedEntry;

          return {
            entries: nextEntries,
          };
        });
      },
      incrementHotpCounter: (_id) => {},
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
      merge: (persistedState, currentState) => {
        const next = persistedState as Partial<OtpStore> | undefined;
        return {
          ...currentState,
          ...next,
          entries: (next?.entries ?? currentState.entries).map(withOtpDefaults),
        };
      },
    },
  ),
);

