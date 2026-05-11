import { generateSync, type HashAlgorithm } from 'otplib';

import { config } from '../constants';
import type { OtpAlgorithm, OtpDigits, OtpPeriod } from '../types';
import { otpService } from './otp.service';

const toOtplibAlgorithm = (algorithm: OtpAlgorithm): HashAlgorithm =>
  algorithm.toLowerCase() as HashAlgorithm;

const normalizeSecret = (secret: string): string => secret.replaceAll(' ', '').trim();

function expectedTotpToken(
  secret: string,
  algorithm: OtpAlgorithm,
  digits: OtpDigits,
  period: OtpPeriod,
  timestamp: number,
): string {
  const normalizedSecret = normalizeSecret(secret);
  const slot = Math.floor(timestamp / 1000 / period);
  const epoch = slot * period * 1000;
  return generateSync({
    secret: normalizedSecret,
    strategy: 'totp',
    algorithm: toOtplibAlgorithm(algorithm),
    digits,
    period,
    epoch,
  });
}

describe('otpService', () => {
  /** base32, ≥16 байт после декодирования (требование otplib v13) */
  const sampleSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

  describe('generateToken', () => {
    it('совпадает с эталонным расчётом otplib для фиксированного времени', () => {
      const timestamp = 1_704_000_000_000;
      const expected = expectedTotpToken(sampleSecret, 'SHA1', 6, 30, timestamp);
      expect(
        otpService.generateToken({
          secret: sampleSecret,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          timestamp,
        }),
      ).toBe(expected);
    });

    it('нормализует пробелы в секрете', () => {
      const timestamp = 1_704_000_000_000;
      const spaced = `${sampleSecret.slice(0, 4)} ${sampleSecret.slice(4)}`;
      const a = otpService.generateToken({ secret: sampleSecret, timestamp });
      const b = otpService.generateToken({ secret: spaced, timestamp });
      expect(a).toBe(b);
    });

    it('бросает ошибку при пустом секрете', () => {
      expect(() => otpService.generateToken({ secret: '   ', timestamp: 0 })).toThrow('OTP secret is empty');
    });

  });

  describe('generateCurrentAndNextToken', () => {
    it('возвращает два разных кода для текущего и следующего слота', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1_704_000_012_000);
      const { currentToken, nextToken } = otpService.generateCurrentAndNextToken({
        secret: sampleSecret,
        period: 30,
      });
      expect(currentToken).toHaveLength(6);
      expect(nextToken).toHaveLength(6);
      expect(currentToken).not.toBe(nextToken);
      jest.restoreAllMocks();
    });
  });

  describe('parseOtpAuthUri', () => {
    it('разбирает валидный otpauth TOTP URI', () => {
      const parsed = otpService.parseOtpAuthUri(
        'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA1&digits=6&period=30',
      );
      expect(parsed).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        type: 'totp',
        counter: undefined,
        issuer: 'GitHub',
        account: 'user@example.com',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });
    });

    it('берёт issuer из label, если нет query issuer', () => {
      const parsed = otpService.parseOtpAuthUri('otpauth://totp/ACME:alice?secret=JBSWY3DPEHPK3PXP');
      expect(parsed.issuer).toBe('ACME');
      expect(parsed.account).toBe('alice');
    });

    it('отклоняет неверную схему', () => {
      expect(() => otpService.parseOtpAuthUri('http://example.com')).toThrow('Invalid OTP URI scheme');
    });

    it('отклоняет неподдерживаемый тип', () => {
      expect(() => otpService.parseOtpAuthUri('otpauth://steam/Label?secret=JBSWY3DPEHPK3PXP')).toThrow(
        'Only TOTP otpauth URIs are supported',
      );
    });

    it('отклоняет отсутствующий secret', () => {
      expect(() => otpService.parseOtpAuthUri('otpauth://totp/Label:user?secret=')).toThrow('OTP secret is missing');
    });

    it('отклоняет неподдерживаемый algorithm', () => {
      expect(() =>
        otpService.parseOtpAuthUri('otpauth://totp/L:user?secret=JBSWY3DPEHPK3PXP&algorithm=MD5'),
      ).toThrow('Unsupported OTP algorithm');
    });

    it('подставляет значения по умолчанию из config', () => {
      const parsed = otpService.parseOtpAuthUri('otpauth://totp/Svc:user?secret=JBSWY3DPEHPK3PXP');
      expect(parsed.algorithm).toBe(config.defaultOtpAlgorithm);
      expect(parsed.digits).toBe(config.defaultOtpDigits);
      expect(parsed.period).toBe(config.defaultOtpPeriod);
    });
  });

  describe('validateTotpSetup', () => {
    it('возвращает true для корректного base32-секрета', () => {
      expect(otpService.validateTotpSetup(sampleSecret, 'SHA1', 6, 30)).toBe(true);
    });

    it('возвращает false при невалидном секрете', () => {
      expect(otpService.validateTotpSetup('!!!not-base32!!!', 'SHA1', 6, 30)).toBe(false);
    });
  });
});
