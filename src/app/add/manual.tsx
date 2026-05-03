import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../hooks/useTheme';
import { otpService } from '../../services/otp.service';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';
import type { OtpAlgorithm, OtpDigits, OtpPeriod } from '../../types';

const ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
const DIGITS_OPTIONS: OtpDigits[] = [6, 8];
const PERIOD_OPTIONS: OtpPeriod[] = [30, 60];

function createEntryId(): string {
  const bytes = Crypto.getRandomBytes(16);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function normalizeSecretInput(value: string): string {
  return value.replace(/\s/g, '').trim();
}

type FieldErrors = {
  account?: string;
  secret?: string;
};

export default function ManualEntryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const upsertEntry = useOtpStore((state) => state.upsertEntry);

  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('MAZDIMJYG5ZGM3LPGEZWI2LSOF3WU23MHNSQ====');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>('SHA1');
  const [digits, setDigits] = useState<OtpDigits>(6);
  const [period, setPeriod] = useState<OtpPeriod>(30);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    const nextErrors: FieldErrors = {};
    const trimmedAccount = account.trim();
    if (!trimmedAccount) {
      nextErrors.account = t('errorAccountRequired');
    }

    const normalizedSecret = normalizeSecretInput(secret);
    if (!normalizedSecret) {
      nextErrors.secret = t('errorSecretRequired');
    } else if (!otpService.validateTotpSetup(normalizedSecret, algorithm, digits, period)) {
      nextErrors.secret = t('errorSecretInvalid');
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const id = createEntryId();
      await storageService.setOtpSecret(id, normalizedSecret);
      upsertEntry({
        id,
        issuer: issuer.trim(),
        account: trimmedAccount,
        algorithm,
        digits,
        period,
        createdAt: Date.now(),
      });
      router.dismissTo('/(tabs)');
    } catch {
      setSaveError(t('errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [account, algorithm, digits, issuer, period, secret, t, upsertEntry]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}
      >
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClose}>
            <Text style={[styles.toolbarBtn, { color: colors.primary }]}>{t('cancel')}</Text>
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: colors.text }]}>{t('manualScreenTitle')}</Text>
          <View style={styles.toolbarSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Input
            autoCapitalize="words"
            error={fieldErrors.account}
            label={t('fieldAccount')}
            onChangeText={(text) => {
              setAccount(text);
              setFieldErrors((prev) => ({ ...prev, account: undefined }));
            }}
            placeholder={t('fieldAccountPlaceholder')}
            value={account}
          />

          <Input
            autoCapitalize="none"
            label={t('fieldIssuer')}
            onChangeText={setIssuer}
            placeholder={t('fieldIssuerPlaceholder')}
            value={issuer}
          />

          <Input
            autoCapitalize="characters"
            autoCorrect={false}
            error={fieldErrors.secret}
            label={t('fieldSecret')}
            onChangeText={(text) => {
              setSecret(text);
              setFieldErrors((prev) => ({ ...prev, secret: undefined }));
            }}
            placeholder={t('fieldSecretPlaceholder')}
            value={secret}
          />

          <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldAlgorithm')}</Text>
          <View style={styles.segmentRow}>
            {ALGORITHMS.map((value) => {
              const selected = algorithm === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setAlgorithm(value)}
                  style={[
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surface : colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldDigits')}</Text>
          <View style={styles.segmentRow}>
            {DIGITS_OPTIONS.map((value) => {
              const selected = digits === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setDigits(value)}
                  style={[
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surface : colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>{String(value)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldPeriod')}</Text>
          <View style={styles.segmentRow}>
            {PERIOD_OPTIONS.map((value) => {
              const selected = period === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPeriod(value)}
                  style={[
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surface : colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>
                    {t('periodSeconds', { value })}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {saveError ? <Text style={[styles.saveError, { color: colors.danger }]}>{saveError}</Text> : null}

          <View style={styles.footer}>
            <Button disabled={isSaving} onPress={handleSave} title={t('manualSave')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarBtn: {
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  toolbarSpacer: {
    width: 64,
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveError: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
  },
});
