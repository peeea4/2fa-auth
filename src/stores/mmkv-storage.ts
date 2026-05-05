import type { StateStorage } from "zustand/middleware";

import { getEncryptedMmkv, MMKV_ZUSTAND_PERSIST_ID } from "../services/mmkv-secure.factory";

export const mmkvStorage: StateStorage = {
  getItem: async (name) => {
    const mmkv = await getEncryptedMmkv(MMKV_ZUSTAND_PERSIST_ID);
    return mmkv.getString(name) ?? null;
  },
  setItem: (name, value) => {
    void getEncryptedMmkv(MMKV_ZUSTAND_PERSIST_ID).then((mmkv) => {
      mmkv.set(name, value);
    });
  },
  removeItem: (name) => {
    void getEncryptedMmkv(MMKV_ZUSTAND_PERSIST_ID).then((mmkv) => {
      mmkv.remove(name);
    });
  },
};
