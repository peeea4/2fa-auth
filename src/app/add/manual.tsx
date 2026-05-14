import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { IconPickerModal } from '../../components/icons/IconPickerModal';
import { ServiceIcon } from '../../components/icons/ServiceIcon';
import { OtpCardPreview } from '../../components/otp/OtpCardPreview';
import { Button } from '../../components/ui/Button';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { REGISTRY_BY_KEY } from '../../constants/service-registry';
import { useTheme } from '../../hooks/useTheme';
import { matchIssuerToIcon } from '../../services/icon-matching.service';
import { otpService } from '../../services/otp.service';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';
import type { OtpAlgorithm, OtpDigits, OtpEntry, OtpIconSource } from '../../types';

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
  const [iconKey, setIconKey] = useState<string | undefined>(undefined);
  const [iconSource, setIconSource] = useState<OtpIconSource>('initials');
  const [iconColor, setIconColor] = useState<string | undefined>(undefined);
  const [isIconManuallySet, setIsIconManuallySet] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.dismissTo('/(tabs)');
  }, []);

  const handleIconSelect = useCallback((nextKey: string | null) => {
    setIsIconManuallySet(true);
    if (nextKey) {
      const registryEntry = REGISTRY_BY_KEY[nextKey];
      setIconKey(nextKey);
      setIconSource('service');
      setIconColor(registryEntry ? `#${registryEntry.hex}` : undefined);
    } else {
      setIconKey(undefined);
      setIconSource('initials');
      setIconColor(undefined);
    }
  }, []);

  useEffect(() => {
    if (isIconManuallySet) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const matchedIcon = matchIssuerToIcon(issuer);
      setIconKey(matchedIcon?.key);
      setIconSource(matchedIcon ? 'service' : 'initials');
      setIconColor(matchedIcon ? `#${matchedIcon.hex}` : undefined);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isIconManuallySet, issuer]);

  const iconPreviewEntry: OtpEntry = useMemo(
    () => ({
      id: 'manual-icon-preview',
      issuer: issuer.trim() || account.trim() || t('fieldIssuer'),
      account: account.trim() || 'preview',
      algorithm,
      digits,
      period: 30,
      createdAt: 0,
      iconKey,
      iconSource,
      color: iconColor,
    }),
    [account, algorithm, digits, iconColor, iconKey, iconSource, issuer, t],
  );

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
        iconSource,
        color: iconColor,
        createdAt: Date.now(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismissTo('/(tabs)');
    } catch {
      setSaveError(t('errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [account, algorithm, digits, group, iconColor, iconKey, iconSource, issuer, secret, t, upsertEntry]);

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
          <OtpCardPreview entry={iconPreviewEntry} secretDraft={secret} />

          <SectionHeader title={t('formSectionIdentity')} />
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
            variant="filled"
          />
          <Input
            autoCapitalize="none"
            label={t('fieldIssuer')}
            onChangeText={setIssuer}
            placeholder={t('fieldIssuerPlaceholder')}
            value={issuer}
            variant="filled"
          />
          <Input
            label={t('fieldGroup')}
            onChangeText={setGroup}
            placeholder={t('fieldGroupPlaceholder')}
            value={group}
            variant="filled"
          />

          <SectionHeader title={t('formSectionAuthentication')} />
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
            variant="filled"
          />

          <SectionHeader title={t('formSectionAppearance')} />
          <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldIcon')}</Text>
          <View style={styles.iconRow}>
            <Pressable
              accessibilityLabel={t('changeIcon')}
              accessibilityRole="button"
              onPress={() => setIsPickerVisible(true)}
              style={[
                styles.iconPreviewWrap,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <ServiceIcon entry={iconPreviewEntry} size={64} />
            </Pressable>
            <View style={styles.iconRowAction}>
              <Button
                fullWidth={false}
                onPress={() => setIsPickerVisible(true)}
                size="md"
                title={t('changeIcon')}
                variant="secondary"
              />
            </View>
          </View>

          <CollapsibleSection
            expanded={advancedExpanded}
            onToggle={() => setAdvancedExpanded((v) => !v)}
            title={t('formSectionAdvanced')}
          >
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
                    <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>
                      {String(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </CollapsibleSection>
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

      <IconPickerModal
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleIconSelect}
        selectedKey={iconKey ?? null}
        visible={isPickerVisible}
      />
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPreviewWrap: {
    width: 80,
    height: 80,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRowAction: {
    flexShrink: 1,
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
