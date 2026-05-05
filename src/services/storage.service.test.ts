import * as SecureStore from "expo-secure-store";

import { config } from "../constants";
import { storageService } from "./storage.service";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => secureData[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureData[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureData[key];
  }),
}));

const secureData: Record<string, string> = {};

describe("storageService", () => {
  beforeEach(() => {
    Object.keys(secureData).forEach((key) => {
      delete secureData[key];
    });
    jest.clearAllMocks();
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
