import * as SecureStore from "expo-secure-store";

import { config } from "../constants";
import type { OtpEntry } from "../types";
import { getEncryptedMmkv, getMmkvMetadataStoreId } from "./mmkv-secure.factory";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.appName,
};

const getSecretKey = (id: string): string => `${config.otpSecretKeyPrefix}${id}`;

const parseOtpEntries = (rawValue: string | undefined): OtpEntry[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue as OtpEntry[];
  } catch {
    return [];
  }
};

class StorageService {
  async getOtpEntries(): Promise<OtpEntry[]> {
    const mmkv = await getEncryptedMmkv(getMmkvMetadataStoreId());
    return parseOtpEntries(mmkv.getString(config.otpMetadataStorageKey));
  }

  async saveOtpEntries(entries: OtpEntry[]): Promise<void> {
    const mmkv = await getEncryptedMmkv(getMmkvMetadataStoreId());
    mmkv.set(config.otpMetadataStorageKey, JSON.stringify(entries));
  }

  async upsertOtpEntry(entry: OtpEntry): Promise<void> {
    const entries = await this.getOtpEntries();
    const entryIndex = entries.findIndex((item) => item.id === entry.id);

    if (entryIndex >= 0) {
      entries[entryIndex] = entry;
    } else {
      entries.push(entry);
    }

    await this.saveOtpEntries(entries);
  }

  async removeOtpEntry(id: string): Promise<void> {
    const entries = await this.getOtpEntries();
    const nextEntries = entries.filter((entry) => entry.id !== id);

    if (entries.length !== nextEntries.length) {
      await this.saveOtpEntries(nextEntries);
    }
  }

  async getOtpSecret(id: string): Promise<string | null> {
    return SecureStore.getItemAsync(getSecretKey(id), secureStoreOptions);
  }

  async setOtpSecret(id: string, secret: string): Promise<void> {
    await SecureStore.setItemAsync(getSecretKey(id), secret, secureStoreOptions);
  }

  async deleteOtpSecret(id: string): Promise<void> {
    await SecureStore.deleteItemAsync(getSecretKey(id), secureStoreOptions);
  }

  /** Удаляет устаревший PIN приложения из Keychain (раньше хранился в Secure Store). */
  async deleteLegacyAppPinHash(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(config.legacyOtpPinHashKey, secureStoreOptions);
    } catch {
      // ключ мог отсутствовать
    }
  }

  async clearOtpData(): Promise<void> {
    const entries = await this.getOtpEntries();
    const deletionPromises = entries.map((entry) => this.deleteOtpSecret(entry.id));

    await Promise.all(deletionPromises);
    const mmkv = await getEncryptedMmkv(getMmkvMetadataStoreId());
    mmkv.remove(config.otpMetadataStorageKey);
  }
}

export const storageService = new StorageService();
