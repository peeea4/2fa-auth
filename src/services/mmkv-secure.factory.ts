import * as SecureStore from "expo-secure-store";
import { createMMKV, type MMKV } from "react-native-mmkv";

import { config } from "../constants";

/** ID экземпляра MMKV для Zustand persist (не менять — миграция с незашифрованного файла). */
export const MMKV_ZUSTAND_PERSIST_ID = "2fa-auth-zustand-storage";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.appName,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

function isJestWorker(): boolean {
  return process.env.JEST_WORKER_ID != null;
}

function generateAes256BinaryKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += String.fromCharCode(bytes[i] ?? 0);
  }
  return key;
}

function binaryKeyToBase64(key: string): string {
  return btoa(key);
}

function base64ToBinaryKey(encoded: string): string {
  const bin = atob(encoded);
  if (bin.length !== 32) {
    throw new Error("Invalid MMKV encryption key length");
  }
  return bin;
}

const mmkvIds = (): string[] => [MMKV_ZUSTAND_PERSIST_ID];

const mmkvById = new Map<string, MMKV>();
let cachedBinaryKey: string | null = null;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrapEncryptedMmkv(): Promise<void> {
  if (isJestWorker()) {
    return;
  }

  const stored = await SecureStore.getItemAsync(
    config.mmkvEncryptionSecureStoreKey,
    secureStoreOptions,
  );

  if (stored) {
    const key = base64ToBinaryKey(stored);
    cachedBinaryKey = key;
    mmkvById.clear();
    for (const id of mmkvIds()) {
      mmkvById.set(id, createMMKV({ id, encryptionKey: key, encryptionType: "AES-256" }));
    }
    return;
  }

  const key = generateAes256BinaryKey();
  mmkvById.clear();

  for (const id of mmkvIds()) {
    const instance = createMMKV({ id });
    if (!instance.isEncrypted) {
      instance.encrypt(key, "AES-256");
    }
    mmkvById.set(id, instance);
  }

  await SecureStore.setItemAsync(
    config.mmkvEncryptionSecureStoreKey,
    binaryKeyToBase64(key),
    secureStoreOptions,
  );
  cachedBinaryKey = key;
}

function ensureBootstrap(): Promise<void> {
  if (isJestWorker()) {
    return Promise.resolve();
  }
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapEncryptedMmkv();
  }
  return bootstrapPromise;
}

/**
 * Возвращает шифрованный экземпляр MMKV (AES-256, ключ в SecureStore).
 * В Jest — обычный mock/createMMKV без bootstrap.
 */
export async function getEncryptedMmkv(id: string): Promise<MMKV> {
  if (isJestWorker()) {
    if (!mmkvById.has(id)) {
      mmkvById.set(id, createMMKV({ id }));
    }
    const instance = mmkvById.get(id);
    if (!instance) {
      throw new Error("MMKV instance missing in test cache");
    }
    return instance;
  }

  await ensureBootstrap();

  const cached = mmkvById.get(id);
  if (cached) {
    return cached;
  }

  const key = cachedBinaryKey;
  if (!key) {
    throw new Error("MMKV encryption key missing after bootstrap");
  }

  const instance = createMMKV({ id, encryptionKey: key, encryptionType: "AES-256" });
  mmkvById.set(id, instance);
  return instance;
}

/** Сброс кэша между тестами (только для unit-тестов). */
export function __resetMmkvEncryptionForTests(): void {
  mmkvById.clear();
  cachedBinaryKey = null;
  bootstrapPromise = null;
}
