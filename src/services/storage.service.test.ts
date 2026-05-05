import * as SecureStore from "expo-secure-store";

import { config } from "../constants";
import type { OtpEntry } from "../types";
import { __resetMmkvEncryptionForTests } from "./mmkv-secure.factory";
import { storageService } from "./storage.service";

const mmkvData: Record<string, string> = {};

jest.mock("react-native-mmkv", () => ({
  createMMKV: jest.fn(() => ({
    getString: (key: string) => mmkvData[key],
    set: (key: string, value: string) => {
      mmkvData[key] = value;
    },
    remove: (key: string) => {
      delete mmkvData[key];
    },
    getAllKeys: () => Object.keys(mmkvData),
    get isEncrypted() {
      return false;
    },
    encrypt: jest.fn(),
  })),
  deleteMMKV: jest.fn(() => true),
  existsMMKV: jest.fn(() => false),
}));

const secureData: Record<string, string> = {};

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => secureData[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureData[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureData[key];
  }),
}));

const sampleEntry = (overrides: Partial<OtpEntry> = {}): OtpEntry => ({
  id: "id-1",
  issuer: "Test",
  account: "a@b.c",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: 1,
  ...overrides,
});

describe("storageService", () => {
  beforeEach(() => {
    __resetMmkvEncryptionForTests();
    Object.keys(mmkvData).forEach((key) => {
      delete mmkvData[key];
    });
    Object.keys(secureData).forEach((key) => {
      delete secureData[key];
    });
    jest.clearAllMocks();
  });

  describe("getOtpEntries / saveOtpEntries", () => {
    it("возвращает пустой массив, если данных нет", async () => {
      await expect(storageService.getOtpEntries()).resolves.toEqual([]);
    });

    it("сохраняет и возвращает записи", async () => {
      const entries = [sampleEntry()];
      await storageService.saveOtpEntries(entries);
      await expect(storageService.getOtpEntries()).resolves.toEqual(entries);
      expect(mmkvData[config.otpMetadataStorageKey]).toBe(JSON.stringify(entries));
    });

    it("игнорирует битый JSON и возвращает []", async () => {
      mmkvData[config.otpMetadataStorageKey] = "{not-json";
      await expect(storageService.getOtpEntries()).resolves.toEqual([]);
    });

    it("игнорирует не-массив JSON", async () => {
      mmkvData[config.otpMetadataStorageKey] = JSON.stringify({ foo: 1 });
      await expect(storageService.getOtpEntries()).resolves.toEqual([]);
    });
  });

  describe("upsertOtpEntry", () => {
    it("добавляет новую запись", async () => {
      await storageService.upsertOtpEntry(sampleEntry());
      await expect(storageService.getOtpEntries()).resolves.toHaveLength(1);
    });

    it("обновляет существующую запись по id", async () => {
      await storageService.upsertOtpEntry(sampleEntry({ account: "old" }));
      await storageService.upsertOtpEntry(sampleEntry({ account: "new" }));
      await expect(storageService.getOtpEntries()).resolves.toEqual([
        sampleEntry({ account: "new" }),
      ]);
    });
  });

  describe("removeOtpEntry", () => {
    it("удаляет запись по id", async () => {
      await storageService.saveOtpEntries([sampleEntry({ id: "a" }), sampleEntry({ id: "b" })]);
      await storageService.removeOtpEntry("a");
      await expect(storageService.getOtpEntries()).resolves.toMatchObject([{ id: "b" }]);
    });

    it("не перезаписывает хранилище, если id не найден", async () => {
      await storageService.saveOtpEntries([sampleEntry()]);
      const before = mmkvData[config.otpMetadataStorageKey];
      await storageService.removeOtpEntry("missing");
      expect(mmkvData[config.otpMetadataStorageKey]).toBe(before);
    });
  });

  describe("OTP secrets (SecureStore)", () => {
    it("читает и пишет секрет с ожидаемым ключом", async () => {
      await storageService.setOtpSecret("id-1", "secret-value");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        `${config.otpSecretKeyPrefix}id-1`,
        "secret-value",
        expect.objectContaining({ keychainService: config.appName }),
      );
      const value = await storageService.getOtpSecret("id-1");
      expect(value).toBe("secret-value");
    });

    it("deleteOtpSecret удаляет ключ", async () => {
      await storageService.setOtpSecret("x", "y");
      await storageService.deleteOtpSecret("x");
      expect(await storageService.getOtpSecret("x")).toBeNull();
    });
  });

  describe("clearOtpData", () => {
    it("удаляет все секреты и метаданные", async () => {
      storageService.saveOtpEntries([
        sampleEntry({ id: "a" }),
        sampleEntry({ id: "b", issuer: "B" }),
      ]);
      await storageService.setOtpSecret("a", "sa");
      await storageService.setOtpSecret("b", "sb");

      await storageService.clearOtpData();

      await expect(storageService.getOtpEntries()).resolves.toEqual([]);
      expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
      expect(await storageService.getOtpSecret("a")).toBeNull();
      expect(await storageService.getOtpSecret("b")).toBeNull();
    });
  });

  describe("deleteLegacyAppPinHash", () => {
    it("вызывает delete для legacy-ключа", async () => {
      await storageService.deleteLegacyAppPinHash();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        config.legacyOtpPinHashKey,
        expect.objectContaining({ keychainService: config.appName }),
      );
    });
  });
});
