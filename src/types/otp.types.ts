export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export type OtpDigits = 6 | 8;

export type OtpPeriod = 30 | 60;

export interface OtpEntry {
  id: string;
  issuer: string;
  account: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: OtpPeriod;
  createdAt: number;
  iconUrl?: string;
  color?: string;
}
