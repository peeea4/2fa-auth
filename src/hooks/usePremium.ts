import { useCallback, useMemo, useState } from 'react';

import { FREE_CODE_LIMIT } from '../constants/limits';
import { adaptyService } from '../services/adapty.service';
import { useOtpStore, usePremiumStore, useSettingsStore } from '../stores';
import type { PremiumState } from '../types';

type UsePremiumResult = {
  premium: PremiumState;
  isCheckingStatus: boolean;
  isRestoringPurchases: boolean;
  canAddCode: boolean;
  canScanQr: boolean;
  canUseBiometric: boolean;
  freeSlotsLeft: number;
  syncSubscriptionStatus: () => Promise<PremiumState>;
  restorePurchases: () => Promise<PremiumState>;
};

const getFreeSlotsLeft = (entriesCount: number): number => Math.max(0, FREE_CODE_LIMIT - entriesCount);

export const usePremium = (): UsePremiumResult => {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);

  const entriesCount = useOtpStore((state) => state.entries.length);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const expiresAt = usePremiumStore((state) => state.expiresAt);
  const productId = usePremiumStore((state) => state.productId);
  const setPremium = usePremiumStore((state) => state.setPremium);
  const devPremiumOverride = useSettingsStore((state) => state.devPremiumOverride);

  const effectiveIsPremium = useMemo(() => isPremium || (__DEV__ && devPremiumOverride), [devPremiumOverride, isPremium]);

  const syncSubscriptionStatus = useCallback(async (): Promise<PremiumState> => {
    setIsCheckingStatus(true);
    try {
      const nextState = await adaptyService.getSubscriptionStatus();
      setPremium(nextState);
      return nextState;
    } finally {
      setIsCheckingStatus(false);
    }
  }, [setPremium]);

  const restorePurchases = useCallback(async (): Promise<PremiumState> => {
    setIsRestoringPurchases(true);
    try {
      const nextState = await adaptyService.restorePurchases();
      setPremium(nextState);
      return nextState;
    } finally {
      setIsRestoringPurchases(false);
    }
  }, [setPremium]);

  const freeSlotsLeft = useMemo(() => getFreeSlotsLeft(entriesCount), [entriesCount]);
  const canAddCode = effectiveIsPremium || freeSlotsLeft > 0;

  const premiumDisplay = useMemo((): PremiumState => {
    if (effectiveIsPremium && !isPremium && __DEV__ && devPremiumOverride) {
      return {
        isPremium: true,
        expiresAt: null,
        productId: 'dev_preview',
      };
    }
    return {
      isPremium,
      expiresAt,
      productId,
    };
  }, [devPremiumOverride, effectiveIsPremium, expiresAt, isPremium, productId]);

  return {
    premium: premiumDisplay,
    isCheckingStatus,
    isRestoringPurchases,
    canAddCode,
    canScanQr: effectiveIsPremium,
    canUseBiometric: effectiveIsPremium,
    freeSlotsLeft,
    syncSubscriptionStatus,
    restorePurchases,
  };
};
