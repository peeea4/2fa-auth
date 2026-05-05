import * as SecureStore from "expo-secure-store";

import { config } from "../constants";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.appName,
};

const getSecretKey = (id: string): string => `${config.otpSecretKeyPrefix}${id}`;

/** Секреты OTP в Secure Store; метаданные — только через `useOtpStore` (Zustand + MMKV persist). */
class StorageService {
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
}

export const storageService = new StorageService();
