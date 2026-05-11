import { generateSync, type HashAlgorithm } from 'otplib';

import { config } from '../constants';
import type { OtpAlgorithm, OtpDigits, OtpPeriod, OtpType } from '../types';

type GenerateTokenInput = {
  secret: string;
  type?: OtpType;
  counter?: number;
  algorithm?: OtpAlgorithm;
  digits?: OtpDigits;
  period?: OtpPeriod;
  timestamp?: number;
};

type GenerateCurrentAndNextTokenInput = Omit<GenerateTokenInput, 'timestamp'>;

export type ParsedOtpAuthUri = {
  secret: string;
  type: OtpType;
  counter?: number;
  issuer: string;
  account: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: OtpPeriod;
};

const SUPPORTED_ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
const SUPPORTED_DIGITS: OtpDigits[] = [6, 8];
const FIXED_TOTP_PERIOD: OtpPeriod = 30;

const isOtpAlgorithm = (value: string): value is OtpAlgorithm =>
  SUPPORTED_ALGORITHMS.includes(value as OtpAlgorithm);

const isOtpDigits = (value: number): value is OtpDigits =>
  SUPPORTED_DIGITS.includes(value as OtpDigits);

const normalizeSecret = (secret: string): string => secret.replaceAll(' ', '').trim();

const toOtplibAlgorithm = (algorithm: OtpAlgorithm): HashAlgorithm => algorithm.toLowerCase() as HashAlgorithm;

const parseOtpLabel = (label: string): { issuer: string; account: string } => {
  const decodedLabel = decodeURIComponent(label).trim();

  if (!decodedLabel) {
    throw new Error('OTP label is empty');
  }

  const separatorIndex = decodedLabel.indexOf(':');
  if (separatorIndex < 0) {
    return {
      issuer: '',
      account: decodedLabel,
    };
  }

  return {
    issuer: decodedLabel.slice(0, separatorIndex).trim(),
    account: decodedLabel.slice(separatorIndex + 1).trim(),
  };
};

class OtpService {
  private tokenCache = new Map<string, { slot: number; token: string }>();

  private getCacheKey(secret: string, algorithm: OtpAlgorithm, digits: OtpDigits, period: OtpPeriod): string {
    return `${algorithm}:${digits}:${period}:${secret}`;
  }

  private getTokenForSlot(
    secret: string,
    algorithm: OtpAlgorithm,
    digits: OtpDigits,
    period: OtpPeriod,
    slot: number,
  ): string {
    const normalizedSecret = normalizeSecret(secret);
    if (!normalizedSecret) {
      throw new Error('OTP secret is empty');
    }

    const cacheKey = this.getCacheKey(normalizedSecret, algorithm, digits, period);
    const cachedValue = this.tokenCache.get(cacheKey);
    if (cachedValue?.slot === slot) {
      return cachedValue.token;
    }

    const epoch = slot * period * 1000;
    const token = generateSync({
      secret: normalizedSecret,
      strategy: 'totp',
      algorithm: toOtplibAlgorithm(algorithm),
      digits,
      period,
      epoch,
    });
    this.tokenCache.set(cacheKey, { slot, token });

    return token;
  }

  generateToken({
    secret,
    type = 'totp',
    algorithm = config.defaultOtpAlgorithm,
    digits = config.defaultOtpDigits,
    period = FIXED_TOTP_PERIOD,
    timestamp = Date.now(),
  }: GenerateTokenInput): string {
    const normalizedSecret = normalizeSecret(secret);
    if (!normalizedSecret) {
      throw new Error('OTP secret is empty');
    }
    void type;
    const slot = Math.floor(timestamp / 1000 / period);
    return this.getTokenForSlot(normalizedSecret, algorithm, digits, period, slot);
  }

  generateCurrentAndNextToken({
    secret,
    algorithm = config.defaultOtpAlgorithm,
    digits = config.defaultOtpDigits,
    period = FIXED_TOTP_PERIOD,
  }: GenerateCurrentAndNextTokenInput): { currentToken: string; nextToken: string } {
    const currentSlot = Math.floor(Date.now() / 1000 / period);

    return {
      currentToken: this.getTokenForSlot(secret, algorithm, digits, period, currentSlot),
      nextToken: this.getTokenForSlot(secret, algorithm, digits, period, currentSlot + 1),
    };
  }

  parseOtpAuthUri(value: string): ParsedOtpAuthUri {
    const qrValue = value.trim();
    if (!qrValue.toLowerCase().startsWith('otpauth://')) {
      throw new Error('Invalid OTP URI scheme');
    }

    let uri: URL;
    try {
      uri = new URL(qrValue);
    } catch {
      throw new Error('Invalid OTP URI');
    }

    const otpType = uri.hostname.toLowerCase();
    if (otpType !== 'totp') {
      throw new Error('Only TOTP otpauth URIs are supported');
    }

    const { issuer: labelIssuer, account } = parseOtpLabel(uri.pathname.slice(1));
    if (!account) {
      throw new Error('OTP account is missing');
    }

    const secret = normalizeSecret(uri.searchParams.get('secret') ?? '');
    if (!secret) {
      throw new Error('OTP secret is missing');
    }

    const rawAlgorithm = (uri.searchParams.get('algorithm') ?? config.defaultOtpAlgorithm).toUpperCase();
    if (!isOtpAlgorithm(rawAlgorithm)) {
      throw new Error(`Unsupported OTP algorithm: ${rawAlgorithm}`);
    }

    const rawDigits = Number(uri.searchParams.get('digits') ?? config.defaultOtpDigits);
    if (!Number.isInteger(rawDigits) || !isOtpDigits(rawDigits)) {
      throw new Error(`Unsupported OTP digits: ${rawDigits}`);
    }

    const rawPeriod: OtpPeriod = FIXED_TOTP_PERIOD;

    const queryIssuer = (uri.searchParams.get('issuer') ?? '').trim();
    const issuer = queryIssuer || labelIssuer;

    return {
      secret,
      type: 'totp',
      counter: undefined,
      issuer,
      account,
      algorithm: rawAlgorithm,
      digits: rawDigits,
      period: rawPeriod,
    };
  }

  /** Returns true if the secret decodes and produces a TOTP for the given parameters. */
  validateTotpSetup(secret: string, algorithm: OtpAlgorithm, digits: OtpDigits, period: OtpPeriod): boolean {
    try {
      this.generateToken({ secret, algorithm, digits, period });
      return true;
    } catch {
      return false;
    }
  }
}

export const otpService = new OtpService();

