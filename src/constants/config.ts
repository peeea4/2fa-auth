import type { OtpAlgorithm, OtpDigits, OtpPeriod } from '../types';

export const config: {
  appName: string;
  otpSecretKeyPrefix: string;
  otpMetadataStorageKey: string;
  otpPinHashKey: string;
  defaultOtpAlgorithm: OtpAlgorithm;
  defaultOtpDigits: OtpDigits;
  defaultOtpPeriod: OtpPeriod;
} = {
  appName: '2FA Authenticator',
  otpSecretKeyPrefix: 'otp_secret_',
  otpMetadataStorageKey: 'otp_entries',
  otpPinHashKey: 'otp_pin_hash',
  defaultOtpAlgorithm: 'SHA1',
  defaultOtpDigits: 6,
  defaultOtpPeriod: 30,
};
