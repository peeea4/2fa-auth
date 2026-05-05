import { config } from "../constants";
import { __resetMmkvEncryptionForTests } from "../services/mmkv-secure.factory";
import type { OtpEntry } from "../types";
import { useOtpStore } from "./otp.store";

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
  id: "id-1",
  issuer: "Test",
  account: "a@b.c",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: 1,
  ...overrides,
});

describe("useOtpStore", () => {
  beforeEach(async () => {
    __resetMmkvEncryptionForTests();
    Object.keys(mmkvData).forEach((key) => {
      delete mmkvData[key];
    });
    await useOtpStore.persist.clearStorage();
    useOtpStore.setState({ entries: [] });
    jest.clearAllMocks();
  });

  it("setEntries задаёт список целиком", () => {
    const entries = [sampleEntry(), sampleEntry({ id: "id-2" })];
    useOtpStore.getState().setEntries(entries);
    expect(useOtpStore.getState().entries).toEqual(entries);
  });

  it("upsertEntry добавляет новую запись", () => {
    useOtpStore.getState().upsertEntry(sampleEntry());
    expect(useOtpStore.getState().entries).toHaveLength(1);
  });

  it("upsertEntry обновляет существующую запись по id", () => {
    useOtpStore.getState().upsertEntry(sampleEntry({ account: "old" }));
    useOtpStore.getState().upsertEntry(sampleEntry({ account: "new" }));
    expect(useOtpStore.getState().entries).toEqual([sampleEntry({ account: "new" })]);
  });

  it("removeEntry удаляет по id", () => {
    useOtpStore.getState().setEntries([sampleEntry({ id: "a" }), sampleEntry({ id: "b" })]);
    useOtpStore.getState().removeEntry("a");
    expect(useOtpStore.getState().entries).toMatchObject([{ id: "b" }]);
  });

  it("clearEntries очищает список", () => {
    useOtpStore.getState().setEntries([sampleEntry()]);
    useOtpStore.getState().clearEntries();
    expect(useOtpStore.getState().entries).toEqual([]);
  });

  it("persist сохраняет записи в MMKV под ключом имени стора", async () => {
    useOtpStore.getState().setEntries([sampleEntry()]);
    await new Promise((r) => setTimeout(r, 0));
    const raw = mmkvData["otp.store"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw ?? "{}") as { state?: { entries?: OtpEntry[] } };
    expect(parsed.state?.entries).toEqual([sampleEntry()]);
  });

  it("не пишет в устаревший ключ метаданных storage.service", async () => {
    useOtpStore.getState().setEntries([sampleEntry()]);
    await new Promise((r) => setTimeout(r, 0));
    expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
  });
});
