import { useCallback, useEffect, useState } from 'react';

import type { BiometricAuthResult, BiometricAvailability } from '../services/biometric.service';
import { biometricService } from '../services/biometric.service';
import { useAuthStore } from '../stores';

type UseBiometricsResult = {
  availability: BiometricAvailability | null;
  isCheckingAvailability: boolean;
  isAuthenticating: boolean;
  refreshAvailability: () => Promise<BiometricAvailability>;
  authenticate: () => Promise<BiometricAuthResult>;
  setBiometricEnabled: (isEnabled: boolean) => void;
  canUseBiometrics: boolean;
  isBiometricEnabled: boolean;
};

const FALLBACK_AUTH_RESULT: BiometricAuthResult = {
  success: false,
  usedFallbackToPin: true,
  error: 'not_available',
  warning: 'Biometric auth unavailable, fallback to PIN required.',
};

export const useBiometrics = (): UseBiometricsResult => {
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const refreshAvailability = useCallback(async (): Promise<BiometricAvailability> => {
    setIsCheckingAvailability(true);
    try {
      const nextAvailability = await biometricService.getAvailability();
      setAvailability(nextAvailability);
      return nextAvailability;
    } finally {
      setIsCheckingAvailability(false);
    }
  }, []);

  useEffect(() => {
    void refreshAvailability();
  }, [refreshAvailability]);

  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    setIsAuthenticating(true);
    try {
      const latestAvailability = availability ?? (await refreshAvailability());
      if (!latestAvailability.isAvailable) {
        return FALLBACK_AUTH_RESULT;
      }

      return biometricService.authenticate();
    } finally {
      setIsAuthenticating(false);
    }
  }, [availability, refreshAvailability]);

  return {
    availability,
    isCheckingAvailability,
    isAuthenticating,
    refreshAvailability,
    authenticate,
    setBiometricEnabled,
    canUseBiometrics: Boolean(availability?.isAvailable),
    isBiometricEnabled,
  };
};
