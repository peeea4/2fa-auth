import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BiometricPrompt, PinPad } from '../components/lock';
import { Button } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { biometricService } from '../services/biometric.service';
import { storageService } from '../services/storage.service';
import { useAuthStore } from '../stores';

const PIN_LENGTH = 4;

const hashPin = async (pin: string): Promise<string> => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
};

export default function LockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);
  const incrementFailedAttempts = useAuthStore((state) => state.incrementFailedAttempts);
  const failedAttempts = useAuthStore((state) => state.failedAttempts);
  const setPinSet = useAuthStore((state) => state.setPinSet);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);

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
        promptMessage: 'Unlock your authenticator',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        unlock();
      } else {
        setErrorText('Biometric auth failed. Enter your PIN.');
      }
    } finally {
      setIsSubmittingBiometric(false);
    }
  }, [unlock]);

  useEffect(() => {
    if (isBiometricEnabled && biometricAvailable) {
      void handleBiometricUnlock();
    }
  }, [biometricAvailable, handleBiometricUnlock, isBiometricEnabled]);

  const handlePinSubmit = useCallback(
    async (enteredPin: string) => {
      setIsSubmittingPin(true);
      setErrorText(null);

      try {
        const existingPinHash = await storageService.getPinHash();
        const enteredPinHash = await hashPin(enteredPin);

        if (!existingPinHash) {
          await storageService.setPinHash(enteredPinHash);
          setPinSet(true);
          unlock();
          return;
        }

        if (existingPinHash === enteredPinHash) {
          unlock();
          return;
        }

        incrementFailedAttempts();
        setErrorText('Wrong PIN. Try again.');
        setPinValue('');
      } finally {
        setIsSubmittingPin(false);
      }
    },
    [incrementFailedAttempts, setPinSet, unlock],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>App locked</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Enter your 4-digit PIN to continue.
        </Text>

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
          title={isSubmittingPin ? 'Checking...' : 'Unlock with PIN'}
          disabled={isSubmittingPin || pinValue.length !== PIN_LENGTH}
          onPress={() => {
            void handlePinSubmit(pinValue);
          }}
        />

        <BiometricPrompt
          isAvailable={isBiometricEnabled && biometricAvailable}
          isLoading={isSubmittingBiometric}
          onPress={() => {
            void handleBiometricUnlock();
          }}
        />

        {errorText ? <Text style={[styles.error, { color: colors.danger }]}>{errorText}</Text> : null}
        {failedAttempts > 0 ? (
          <Text style={[styles.attempts, { color: colors.textMuted }]}>Failed attempts: {failedAttempts}</Text>
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
