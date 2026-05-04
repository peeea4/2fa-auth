import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '../components/lock';
import { useTheme } from '../hooks/useTheme';
import { cryptoService } from '../services/crypto.service';
import { storageService } from '../services/storage.service';
import { useAuthStore } from '../stores';

const PIN_LENGTH = 4;

type Phase = 'current' | 'new' | 'confirm';

export default function SetupPinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const setPinSet = useAuthStore((state) => state.setPinSet);

  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('new');
  const [pinValue, setPinValue] = useState('');
  const [draftNew, setDraftNew] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const hash = await storageService.getPinHash();
      if (!active) {
        return;
      }
      setPhase(hash ? 'current' : 'new');
      setIsReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPinValue('');
    setErrorText(null);
  }, [phase]);

  const finish = useCallback(
    async (pin: string) => {
      await cryptoService.savePin(pin);
      setPinSet(true);
      router.back();
    },
    [router, setPinSet],
  );

  const handleSubmit = useCallback(
    async (entered: string) => {
      setErrorText(null);

      if (phase === 'current') {
        const hash = await storageService.getPinHash();
        const ok = await cryptoService.verifyPin(entered, hash);
        if (!ok) {
          setErrorText(t('setupPin.wrongCurrent'));
          setPinValue('');
          return;
        }
        setPhase('new');
        return;
      }

      if (phase === 'new') {
        setDraftNew(entered);
        setPhase('confirm');
        return;
      }

      if (phase === 'confirm') {
        if (entered !== draftNew) {
          setErrorText(t('setupPin.mismatch'));
          setPinValue('');
          setPhase('new');
          setDraftNew(null);
          return;
        }
        await finish(entered);
      }
    },
    [draftNew, finish, phase, t],
  );

  const titleKey =
    phase === 'current' ? 'setupPin.phaseCurrent' : phase === 'new' ? 'setupPin.phaseNew' : 'setupPin.phaseConfirm';

  if (!isReady) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t('setupPin.title'), headerShown: true }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('setupPin.title'), headerShown: true }} />
      <View style={styles.inner}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t(titleKey)}</Text>
        <PinPad
          disabled={false}
          pinLength={PIN_LENGTH}
          value={pinValue}
          onChange={(next) => {
            setPinValue(next);
            if (errorText) {
              setErrorText(null);
            }
          }}
          onSubmit={(value) => {
            void handleSubmit(value);
          }}
        />
        {errorText ? <Text style={[styles.error, { color: colors.danger }]}>{errorText}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
