import { FREE_CODE_LIMIT } from '../constants/limits';

export function getFreeSlotsLeft(entriesCount: number): number {
  return Math.max(0, FREE_CODE_LIMIT - entriesCount);
}

export function computeEffectiveIsPremium(
  isPremium: boolean,
  devPremiumOverride: boolean,
  isDev: boolean,
): boolean {
  return isPremium || (isDev && devPremiumOverride);
}

export function computeCanAddCode(effectiveIsPremium: boolean, entriesCount: number): boolean {
  return effectiveIsPremium || getFreeSlotsLeft(entriesCount) > 0;
}

export function computeCanScanQr(effectiveIsPremium: boolean): boolean {
  return effectiveIsPremium;
}

export function computeCanUseBiometric(effectiveIsPremium: boolean): boolean {
  return effectiveIsPremium;
}

export function isOtpListCardLocked(isPremium: boolean, listIndex: number): boolean {
  return !isPremium && listIndex >= FREE_CODE_LIMIT;
}
