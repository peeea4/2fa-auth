import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BiometricPrompt } from '../components/lock';
import { Button } from '../components/ui';
import { usePremium } from '../hooks/usePremium';
import { useTheme } from '../hooks/useTheme';
import { biometricService } from '../services/biometric.service';
import { useAuthStore } from '../stores';

export default function LockScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { canUseBiometric } = usePremium();

  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isSubmittingBiometric, setIsSubmittingBiometric] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const hasAutoPromptedRef = useRef(false);

  const needsDeviceGate = canUseBiometric && isBiometricEnabled;

  useEffect(() => {
    if (!isLocked) {
      router.replace('/(tabs)');
    }
  }, [isLocked, router]);

  useEffect(() => {
    if (!isLocked) {
      return;
    }
    if (!needsDeviceGate) {
      unlock();
    }
  }, [isLocked, needsDeviceGate, unlock]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const available = await biometricService.isAvailable();
      if (active) {
        setBiometricAvailable(available);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    setIsSubmittingBiometric(true);
    setErrorText(null);

    try {
      const result = await biometricService.authenticate({
        promptMessage: t('lock.deviceAuthPrompt'),
        cancelLabel: t('cancel'),
        fallbackLabel: t('lock.deviceAuthFallback'),
      });

      if (result.success) {
        unlock();
      } else {
        setErrorText(t('lock.deviceAuthFailed'));
      }
    } finally {
      setIsSubmittingBiometric(false);
    }
  }, [t, unlock]);

  useEffect(() => {
    if (!isLocked || !needsDeviceGate || !biometricAvailable || hasAutoPromptedRef.current) {
      return;
    }
    hasAutoPromptedRef.current = true;
    void handleBiometricUnlock();
  }, [biometricAvailable, handleBiometricUnlock, isLocked, needsDeviceGate]);

  const handleDisableProtection = useCallback(() => {
    Alert.alert(t('lock.disableProtectionTitle'), t('lock.disableProtectionBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('lock.disableProtectionConfirm'),
        style: 'destructive',
        onPress: () => {
          setBiometricEnabled(false);
          unlock();
        },
      },
    ]);
  }, [setBiometricEnabled, t, unlock]);

  if (!isLocked || !needsDeviceGate) {
    return null;
  }

  const systemAuthUnreachable = !biometricAvailable;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('lock.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('lock.subtitleDevice')}</Text>

        {systemAuthUnreachable ? (
          <View style={styles.fallback}>
            <Text style={[styles.fallbackText, { color: colors.textMuted }]}>{t('lock.deviceAuthUnavailable')}</Text>
            <Button title={t('lock.disableProtectionCta')} variant="secondary" onPress={handleDisableProtection} />
          </View>
        ) : (
          <>
            <BiometricPrompt
              isAvailable={biometricAvailable}
              isLoading={isSubmittingBiometric}
              onPress={() => {
                void handleBiometricUnlock();
              }}
            />
            {errorText ? <Text style={[styles.error, { color: colors.danger }]}>{errorText}</Text> : null}
          </>
        )}
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
  fallback: {
    gap: 16,
    marginTop: 8,
  },
  fallbackText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
