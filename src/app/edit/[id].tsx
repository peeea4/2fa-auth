import { router, useLocalSearchParams } from 'expo-router';
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
import { OtpAdvancedSection } from '../../components/otp/OtpAdvancedSection';
import { OtpCardPreview } from '../../components/otp/OtpCardPreview';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { REGISTRY_BY_KEY } from '../../constants/service-registry';
import { useTheme } from '../../hooks/useTheme';
import { otpService } from '../../services/otp.service';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';
import type { OtpAlgorithm, OtpDigits, OtpEntry, OtpIconSource } from '../../types';

function normalizeSecretInput(value: string): string {
  return value.replace(/\s/g, '').trim();
}

type FieldErrors = {
  account?: string;
  secret?: string;
};

export default function EditOtpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = useMemo(() => (Array.isArray(rawId) ? rawId[0] : rawId) ?? '', [rawId]);

  const entry = useOtpStore((state) => state.entries.find((item) => item.id === id));
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
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewBackingSecret, setPreviewBackingSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPreviewBackingSecret(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const s = await storageService.getOtpSecret(id);
      if (!cancelled) {
        setPreviewBackingSecret(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!entry) {
      return;
    }
    setIssuer(entry.issuer);
    setAccount(entry.account);
    setAlgorithm(entry.algorithm);
    setDigits(entry.digits);
    setGroup(entry.group ?? '');
    setIconKey(entry.iconKey);
    setIconSource(entry.iconSource ?? (entry.iconKey ? 'service' : 'initials'));
    setIconColor(entry.color);
    setSecret('');
    setFieldErrors({});
    setSaveError(null);
  }, [entry]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const iconPreviewEntry: OtpEntry = useMemo(
    () => ({
      id: entry?.id ?? 'edit-icon-preview',
      issuer: issuer.trim() || account.trim() || t('fieldIssuer'),
      account: account.trim() || 'preview',
      algorithm,
      digits,
      period: 30,
      createdAt: entry?.createdAt ?? 0,
      iconKey,
      iconSource,
      iconUrl: entry?.iconUrl,
      color: iconColor,
    }),
    [account, algorithm, digits, entry?.createdAt, entry?.iconUrl, entry?.id, iconColor, iconKey, iconSource, issuer, t],
  );

  const handleIconSelect = useCallback((nextKey: string | null) => {
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

  const handleSave = useCallback(async () => {
    if (!entry) {
      return;
    }

    setSaveError(null);
    const nextErrors: FieldErrors = {};
    const trimmedAccount = account.trim();
    if (!trimmedAccount) {
      nextErrors.account = t('errorAccountRequired');
    }

    const normalizedSecret = normalizeSecretInput(secret);
    if (normalizedSecret && !otpService.validateTotpSetup(normalizedSecret, algorithm, digits, 30)) {
      nextErrors.secret = t('errorSecretInvalid');
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      if (normalizedSecret) {
        await storageService.setOtpSecret(entry.id, normalizedSecret);
      }

      upsertEntry({
        ...entry,
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
      });

      router.dismissTo('/(tabs)');
    } catch {
      setSaveError(t('errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [account, algorithm, digits, entry, group, iconColor, iconKey, iconSource, issuer, secret, t, upsertEntry]);

  if (!id || !entry) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClose}>
            <Text style={[styles.toolbarBtn, { color: colors.primary }]}>{t('close')}</Text>
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: colors.text }]}>{t('editScreenTitle')}</Text>
          <View style={styles.toolbarSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.muted, { color: colors.textMuted }]}>{t('errorEntryNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.toolbarTitle, { color: colors.text }]}>{t('editScreenTitle')}</Text>
          <View style={styles.toolbarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <OtpCardPreview backingSecret={previewBackingSecret} entry={iconPreviewEntry} secretDraft={secret} />

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

          <OtpAdvancedSection
            algorithm={algorithm}
            digits={digits}
            onAlgorithmChange={setAlgorithm}
            onDigitsChange={setDigits}
            onSecretChange={(text) => {
              setSecret(text);
              setFieldErrors((prev) => ({ ...prev, secret: undefined }));
            }}
            secret={secret}
            secretError={fieldErrors.secret}
            secretHint={t('fieldSecretOptionalHint')}
            showSecretField
          />
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
          <Button disabled={isSaving} onPress={handleSave} size="lg" title={t('editSave')} />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  muted: {
    fontSize: 16,
    textAlign: 'center',
  },
});
