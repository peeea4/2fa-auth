import type { OtpAlgorithm, OtpDigits, OtpPeriod } from '../types';

export const config: {
  appName: string;
  otpSecretKeyPrefix: string;
  otpMetadataStorageKey: string;
  /** Только для миграции: старый ключ PIN в Secure Store. */
  legacyOtpPinHashKey: string;
  defaultOtpAlgorithm: OtpAlgorithm;
  defaultOtpDigits: OtpDigits;
  defaultOtpPeriod: OtpPeriod;
} = {
  appName: '2FA Authenticator',
  otpSecretKeyPrefix: 'otp_secret_',
  otpMetadataStorageKey: 'otp_entries',
  legacyOtpPinHashKey: 'otp_pin_hash',
  defaultOtpAlgorithm: 'SHA1',
  defaultOtpDigits: 6,
  defaultOtpPeriod: 30,
};
