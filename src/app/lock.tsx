import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BiometricPrompt, PinPad } from '../components/lock';
import { Button } from '../components/ui';
import { usePremium } from '../hooks/usePremium';
import { useTheme } from '../hooks/useTheme';
import { biometricService } from '../services/biometric.service';
import { cryptoService } from '../services/crypto.service';
import { storageService } from '../services/storage.service';
import { useAuthStore } from '../stores';

const PIN_LENGTH = 4;

export default function LockScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);
  const incrementFailedAttempts = useAuthStore((state) => state.incrementFailedAttempts);
  const failedAttempts = useAuthStore((state) => state.failedAttempts);
  const setPinSet = useAuthStore((state) => state.setPinSet);
  const isPinSet = useAuthStore((state) => state.isPinSet);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const { canUseBiometric } = usePremium();

  const [pinValue, setPinValue] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [isSubmittingBiometric, setIsSubmittingBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!isLocked) {
      router.replace('/(tabs)');
    }
  }, [isLocked, router]);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuthData = async () => {
      const [availability, existingPinHash] = await Promise.all([
        biometricService.isAvailable(),
        storageService.getPinHash(),
      ]);

      if (!isMounted) {
        return;
      }

      setBiometricAvailable(availability);
      setPinSet(Boolean(existingPinHash));
    };

    void hydrateAuthData();

    return () => {
      isMounted = false;
    };
  }, [setPinSet]);

  const handleBiometricUnlock = useCallback(async () => {
    setIsSubmittingBiometric(true);
    setErrorText(null);

    try {
      const result = await biometricService.authenticate({
        promptMessage: t('lock.biometricPrompt'),
        fallbackLabel: t('lock.biometricFallback'),
      });

      if (result.success) {
        unlock();
      } else {
        setErrorText(t('lock.biometricFailed'));
      }
    } finally {
      setIsSubmittingBiometric(false);
    }
  }, [t, unlock]);

  const canPromptBiometric = biometricAvailable && isPinSet && isBiometricEnabled && canUseBiometric;

  useEffect(() => {
    if (canPromptBiometric) {
      void handleBiometricUnlock();
    }
  }, [biometricAvailable, canPromptBiometric, handleBiometricUnlock]);

  const handlePinSubmit = useCallback(
    async (enteredPin: string) => {
      setIsSubmittingPin(true);
      setErrorText(null);

      try {
        const existingPinHash = await storageService.getPinHash();

        if (!existingPinHash) {
          await cryptoService.savePin(enteredPin);
          setPinSet(true);
          unlock();
          return;
        }

        const isValid = await cryptoService.verifyPin(enteredPin, existingPinHash);
        if (isValid) {
          unlock();
          return;
        }

        incrementFailedAttempts();
        setErrorText(t('lock.wrongPin'));
        setPinValue('');
      } finally {
        setIsSubmittingPin(false);
      }
    },
    [incrementFailedAttempts, setPinSet, t, unlock],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('lock.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('lock.subtitle')}</Text>

        <PinPad
          disabled={isSubmittingPin}
          value={pinValue}
          pinLength={PIN_LENGTH}
          onChange={(nextValue) => {
            setPinValue(nextValue);
            if (errorText) {
              setErrorText(null);
            }
          }}
          onSubmit={(value) => {
            void handlePinSubmit(value);
          }}
        />

        <Button
          title={isSubmittingPin ? t('checking') : t('lock.unlockWithPin')}
          disabled={isSubmittingPin || pinValue.length !== PIN_LENGTH}
          onPress={() => {
            void handlePinSubmit(pinValue);
          }}
        />

        <BiometricPrompt
          isAvailable={canPromptBiometric}
          isLoading={isSubmittingBiometric}
          onPress={() => {
            void handleBiometricUnlock();
          }}
        />

        {errorText ? <Text style={[styles.error, { color: colors.danger }]}>{errorText}</Text> : null}
        {failedAttempts > 0 ? (
          <Text style={[styles.attempts, { color: colors.textMuted }]}>
            {t('lock.failedAttempts', { count: failedAttempts })}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  error: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  attempts: {
    fontSize: 13,
    textAlign: 'center',
  },
});
