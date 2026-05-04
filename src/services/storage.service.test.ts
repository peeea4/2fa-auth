import * as SecureStore from 'expo-secure-store';

import { config } from '../constants';
import type { OtpEntry } from '../types';
import { storageService } from './storage.service';

const mmkvData: Record<string, string> = {};

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: (key: string) => mmkvData[key],
    set: (key: string, value: string) => {
      mmkvData[key] = value;
    },
    remove: (key: string) => {
      delete mmkvData[key];
    },
  })),
}));

const secureData: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => secureData[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureData[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureData[key];
  }),
}));

const sampleEntry = (overrides: Partial<OtpEntry> = {}): OtpEntry => ({
  id: 'id-1',
  issuer: 'Test',
  account: 'a@b.c',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  createdAt: 1,
  ...overrides,
});

describe('storageService', () => {
  beforeEach(() => {
    Object.keys(mmkvData).forEach((key) => {
      delete mmkvData[key];
    });
    Object.keys(secureData).forEach((key) => {
      delete secureData[key];
    });
    jest.clearAllMocks();
  });

  describe('getOtpEntries / saveOtpEntries', () => {
    it('возвращает пустой массив, если данных нет', () => {
      expect(storageService.getOtpEntries()).toEqual([]);
    });

    it('сохраняет и возвращает записи', () => {
      const entries = [sampleEntry()];
      storageService.saveOtpEntries(entries);
      expect(storageService.getOtpEntries()).toEqual(entries);
      expect(mmkvData[config.otpMetadataStorageKey]).toBe(JSON.stringify(entries));
    });

    it('игнорирует битый JSON и возвращает []', () => {
      mmkvData[config.otpMetadataStorageKey] = '{not-json';
      expect(storageService.getOtpEntries()).toEqual([]);
    });

    it('игнорирует не-массив JSON', () => {
      mmkvData[config.otpMetadataStorageKey] = JSON.stringify({ foo: 1 });
      expect(storageService.getOtpEntries()).toEqual([]);
    });
  });

  describe('upsertOtpEntry', () => {
    it('добавляет новую запись', () => {
      storageService.upsertOtpEntry(sampleEntry());
      expect(storageService.getOtpEntries()).toHaveLength(1);
    });

    it('обновляет существующую запись по id', () => {
      storageService.upsertOtpEntry(sampleEntry({ account: 'old' }));
      storageService.upsertOtpEntry(sampleEntry({ account: 'new' }));
      expect(storageService.getOtpEntries()).toEqual([sampleEntry({ account: 'new' })]);
    });
  });

  describe('removeOtpEntry', () => {
    it('удаляет запись по id', () => {
      storageService.saveOtpEntries([sampleEntry({ id: 'a' }), sampleEntry({ id: 'b' })]);
      storageService.removeOtpEntry('a');
      expect(storageService.getOtpEntries().map((e) => e.id)).toEqual(['b']);
    });

    it('не перезаписывает хранилище, если id не найден', () => {
      storageService.saveOtpEntries([sampleEntry()]);
      const before = mmkvData[config.otpMetadataStorageKey];
      storageService.removeOtpEntry('missing');
      expect(mmkvData[config.otpMetadataStorageKey]).toBe(before);
    });
  });

  describe('OTP secrets (SecureStore)', () => {
    it('читает и пишет секрет с ожидаемым ключом', async () => {
      await storageService.setOtpSecret('id-1', 'secret-value');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        `${config.otpSecretKeyPrefix}id-1`,
        'secret-value',
        expect.objectContaining({ keychainService: config.appName }),
      );
      const value = await storageService.getOtpSecret('id-1');
      expect(value).toBe('secret-value');
    });

    it('deleteOtpSecret удаляет ключ', async () => {
      await storageService.setOtpSecret('x', 'y');
      await storageService.deleteOtpSecret('x');
      expect(await storageService.getOtpSecret('x')).toBeNull();
    });
  });

  describe('clearOtpData', () => {
    it('удаляет все секреты и метаданные', async () => {
      storageService.saveOtpEntries([sampleEntry({ id: 'a' }), sampleEntry({ id: 'b', issuer: 'B' })]);
      await storageService.setOtpSecret('a', 'sa');
      await storageService.setOtpSecret('b', 'sb');

      await storageService.clearOtpData();

      expect(storageService.getOtpEntries()).toEqual([]);
      expect(mmkvData[config.otpMetadataStorageKey]).toBeUndefined();
      expect(await storageService.getOtpSecret('a')).toBeNull();
      expect(await storageService.getOtpSecret('b')).toBeNull();
    });
  });

  describe('deleteLegacyAppPinHash', () => {
    it('вызывает delete для legacy-ключа', async () => {
      await storageService.deleteLegacyAppPinHash();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        config.legacyOtpPinHashKey,
        expect.objectContaining({ keychainService: config.appName }),
      );
    });
  });
});
