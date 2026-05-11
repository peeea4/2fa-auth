export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export type OtpDigits = 6 | 8;

export type OtpPeriod = 30;
export type OtpType = 'totp';

export interface OtpEntry {
  id: string;
  issuer: string;
  account: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: OtpPeriod;
  type?: OtpType;
  counter?: number;
  createdAt: number;
  iconUrl?: string;
  iconKey?: string;
  color?: string;
  group?: string;
}
