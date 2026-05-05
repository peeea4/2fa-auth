import { config } from "../constants";
import { useOtpStore } from "../stores/otp.store";
import type { OtpEntry } from "../types";
import { getEncryptedMmkv } from "./mmkv-secure.factory";

const LEGACY_OTP_METADATA_MMKV_ID = `${config.appName}.storage`;

function parseLegacyOtpEntries(raw: string | undefined): OtpEntry[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as OtpEntry[];
  } catch {
    return [];
  }
}

/**
 * Раньше метаданные OTP дублировались во втором MMKV; сейчас единственный источник — Zustand persist.
 * Переносит данные из legacy-хранилища, если persist пустой, и удаляет legacy-ключ.
 */
export async function migrateLegacyOtpMetadataIfNeeded(): Promise<void> {
  await useOtpStore.persist.rehydrate();

  const legacyMmkv = await getEncryptedMmkv(LEGACY_OTP_METADATA_MMKV_ID);
  const raw = legacyMmkv.getString(config.otpMetadataStorageKey);
  const legacyEntries = parseLegacyOtpEntries(raw);

  if (legacyEntries.length === 0) {
    if (raw !== undefined && raw !== null) {
      legacyMmkv.remove(config.otpMetadataStorageKey);
    }
    return;
  }

  const current = useOtpStore.getState().entries;
  if (current.length === 0) {
    useOtpStore.getState().setEntries(legacyEntries);
  }

  legacyMmkv.remove(config.otpMetadataStorageKey);
}
