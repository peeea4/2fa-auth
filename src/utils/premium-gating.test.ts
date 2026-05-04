import { FREE_CODE_LIMIT } from '../constants/limits';
import {
  computeCanAddCode,
  computeCanScanQr,
  computeCanUseBiometric,
  computeEffectiveIsPremium,
  getFreeSlotsLeft,
  isOtpListCardLocked,
} from './premium-gating';

describe('getFreeSlotsLeft', () => {
  it('возвращает FREE_CODE_LIMIT при нуле записей', () => {
    expect(getFreeSlotsLeft(0)).toBe(FREE_CODE_LIMIT);
  });

  it('уменьшается с ростом числа записей и не уходит ниже нуля', () => {
    expect(getFreeSlotsLeft(3)).toBe(FREE_CODE_LIMIT - 3);
    expect(getFreeSlotsLeft(FREE_CODE_LIMIT)).toBe(0);
    expect(getFreeSlotsLeft(FREE_CODE_LIMIT + 10)).toBe(0);
  });
});

describe('computeEffectiveIsPremium', () => {
  it('true, если подписка активна', () => {
    expect(computeEffectiveIsPremium(true, false, false)).toBe(true);
    expect(computeEffectiveIsPremium(true, false, true)).toBe(true);
  });

  it('учитывает dev override только в dev-сборке', () => {
    expect(computeEffectiveIsPremium(false, true, true)).toBe(true);
    expect(computeEffectiveIsPremium(false, true, false)).toBe(false);
  });
});

describe('computeCanAddCode', () => {
  it('разрешает при премиуме независимо от лимита', () => {
    expect(computeCanAddCode(true, FREE_CODE_LIMIT + 100)).toBe(true);
  });

  it('разрешает бесплатным, пока есть свободные слоты', () => {
    expect(computeCanAddCode(false, 0)).toBe(true);
    expect(computeCanAddCode(false, FREE_CODE_LIMIT - 1)).toBe(true);
  });

  it('запрещает при исчерпании лимита без премиума', () => {
    expect(computeCanAddCode(false, FREE_CODE_LIMIT)).toBe(false);
    expect(computeCanAddCode(false, FREE_CODE_LIMIT + 3)).toBe(false);
  });
});

describe('computeCanScanQr / computeCanUseBiometric', () => {
  it('совпадают с effective premium (только премиум)', () => {
    expect(computeCanScanQr(false)).toBe(false);
    expect(computeCanUseBiometric(false)).toBe(false);
    expect(computeCanScanQr(true)).toBe(true);
    expect(computeCanUseBiometric(true)).toBe(true);
  });
});

describe('isOtpListCardLocked', () => {
  it('не блокирует при премиуме', () => {
    expect(isOtpListCardLocked(true, 0)).toBe(false);
    expect(isOtpListCardLocked(true, FREE_CODE_LIMIT + 5)).toBe(false);
  });

  it('блокирует индексы >= FREE_CODE_LIMIT без премиума', () => {
    expect(isOtpListCardLocked(false, FREE_CODE_LIMIT - 1)).toBe(false);
    expect(isOtpListCardLocked(false, FREE_CODE_LIMIT)).toBe(true);
    expect(isOtpListCardLocked(false, FREE_CODE_LIMIT + 1)).toBe(true);
  });
});
