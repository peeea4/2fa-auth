import { config } from "../constants";
import { useOtpStore } from "../stores/otp.store";
import type { OtpEntry } from "../types";
import { migrateLegacyOtpMetadataIfNeeded } from "./migrate-legacy-otp-metadata";
import { __resetMmkvEncryptionForTests } from "./mmkv-secure.factory";

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

const sampleEntry = (overrides: Partial<OtpEntry> = {}): OtpEntry => ({
  id: "legacy-1",
  issuer: "Legacy",
  account: "u@x.y",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: 2,
  ...overrides,
});

describe("migrateLegacyOtpMetadataIfNeeded", () => {
  beforeEach(async () => {
    __resetMmkvEncryptionForTests();
    Object.keys(mmkvData).forEach((key) => {
      delete mmkvData[key];
    });
    await useOtpStore.persist.clearStorage();
    useOtpStore.setState({ entries: [] });
    jest.clearAllMocks();
  });

  it("импортирует legacy JSON в пустой store и удаляет legacy-ключ", async () => {
    mmkvData[config.otpMetadataStorageKey] = JSON.stringify([sampleEntry()]);

    await migrateLegacyOtpMetadataIfNeeded();

    expect(useOtpStore.getState().entries).toEqual([sampleEntry()]);
    expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
  });

  it("не перезаписывает store, если после rehydrate уже есть записи", async () => {
    const persisted = {
      state: { entries: [sampleEntry({ id: "zustand-1", issuer: "Z" })], version: 0 },
      version: 0,
    };
    mmkvData["otp.store"] = JSON.stringify(persisted);
    mmkvData[config.otpMetadataStorageKey] = JSON.stringify([sampleEntry({ id: "legacy-only" })]);

    await migrateLegacyOtpMetadataIfNeeded();

    expect(useOtpStore.getState().entries).toEqual([sampleEntry({ id: "zustand-1", issuer: "Z" })]);
    expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
  });

  it("удаляет битый legacy JSON", async () => {
    mmkvData[config.otpMetadataStorageKey] = "{not-json";

    await migrateLegacyOtpMetadataIfNeeded();

    expect(useOtpStore.getState().entries).toEqual([]);
    expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
  });
});
