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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OTP_ICON_PRESETS } from '../../constants';
import { useTheme } from '../../hooks/useTheme';
import { otpService } from '../../services/otp.service';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';
import type { OtpAlgorithm, OtpDigits } from '../../types';

const ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
const DIGITS_OPTIONS: OtpDigits[] = [6, 8];

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
  const insets = useSafeAreaInsets();
  const upsertEntry = useOtpStore((state) => state.upsertEntry);

  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>('SHA1');
  const [digits, setDigits] = useState<OtpDigits>(6);
  const [group, setGroup] = useState('');
  const [iconKey, setIconKey] = useState(OTP_ICON_PRESETS[0]?.key ?? 'generic');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.dismissTo('/(tabs)');
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
    } else if (!otpService.validateTotpSetup(normalizedSecret, algorithm, digits, 30)) {
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
        period: 30,
        type: 'totp',
        counter: undefined,
        group: group.trim() || undefined,
        iconKey,
        color: OTP_ICON_PRESETS.find((item) => item.key === iconKey)?.color,
        createdAt: Date.now(),
      });
      router.dismissTo('/(tabs)');
    } catch {
      setSaveError(t('errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [account, algorithm, digits, group, iconKey, issuer, secret, t, upsertEntry]);

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

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
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
          <Input label={t('fieldGroup')} onChangeText={setGroup} placeholder={t('fieldGroupPlaceholder')} value={group} />
          <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldIcon')}</Text>
          <View style={styles.segmentRow}>
            {OTP_ICON_PRESETS.map((value) => {
              const selected = iconKey === value.key;
              return (
                <Pressable
                  key={value.key}
                  onPress={() => setIconKey(value.key)}
                  style={[
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surface : colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>
                    {`${value.emoji} ${value.label}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        </ScrollView>

        <View
          style={[
            styles.submitBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 16),
              ...(Platform.OS === 'ios'
                ? {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                  }
                : { elevation: 10 }),
            },
          ]}
        >
          {saveError ? <Text style={[styles.saveError, { color: colors.danger }]}>{saveError}</Text> : null}
          <Button disabled={isSaving} onPress={handleSave} size="lg" title={t('manualSave')} />
        </View>
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
    paddingTop: 14,
    paddingBottom: 12,
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
  scrollView: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 24,
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
    marginBottom: 10,
  },
  submitBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 0,
  },
});
