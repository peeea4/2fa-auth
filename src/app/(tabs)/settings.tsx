import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { config } from '../../constants/config';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/resolve-language';
import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { biometricService } from '../../services/biometric.service';
import { useAuthStore, useSettingsStore } from '../../stores';
import type { AppTheme } from '../../stores/settings.store';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
};

const THEME_OPTIONS: { value: AppTheme; labelKey: string }[] = [
  { value: 'light', labelKey: 'settingsScreen.themeLight' },
  { value: 'dark', labelKey: 'settingsScreen.themeDark' },
  { value: 'system', labelKey: 'settingsScreen.themeSystem' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, theme, setTheme } = useTheme();
  const lock = useAuthStore((state) => state.lock);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const devPremiumOverride = useSettingsStore((state) => state.devPremiumOverride);
  const setDevPremiumOverride = useSettingsStore((state) => state.setDevPremiumOverride);

  const { premium, canUseBiometric } = usePremium();

  const [biometricHardware, setBiometricHardware] = useState(false);

  const refreshBiometricAvailability = useCallback(() => {
    void (async () => {
      const bioAvailable = await biometricService.isAvailable();
      setBiometricHardware(bioAvailable);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshBiometricAvailability();
    }, [refreshBiometricAvailability]),
  );

  useEffect(() => {
    if (!canUseBiometric && isBiometricEnabled) {
      setBiometricEnabled(false);
    }
  }, [canUseBiometric, isBiometricEnabled, setBiometricEnabled]);

  const handleDeviceAuthToggle = async (next: boolean) => {
    if (!canUseBiometric) {
      return;
    }
    if (!biometricHardware) {
      Alert.alert(t('settingsScreen.deviceAuthUnavailableTitle'), t('settingsScreen.deviceAuthUnavailableBody'));
      return;
    }
    if (!next) {
      setBiometricEnabled(false);
      return;
    }
    const result = await biometricService.authenticate({
      promptMessage: t('settingsScreen.deviceAuthEnablePrompt'),
      cancelLabel: t('cancel'),
      fallbackLabel: t('lock.deviceAuthFallback'),
    });
    if (result.success) {
      setBiometricEnabled(true);
    }
  };

  const handleLanguagePress = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  const handleShowOnboardingAgain = () => {
    setOnboardingCompleted(false);
    router.replace('/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';

  const deviceAuthSwitchDisabled = !canUseBiometric || !biometricHardware;
  const deviceAuthSwitchValue = Boolean(isBiometricEnabled && canUseBiometric);

  const canLockNow = canUseBiometric && isBiometricEnabled;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('settings')}</Text>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.security')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settingsScreen.deviceAuth')}</Text>
              <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                {!canUseBiometric
                  ? t('settingsScreen.deviceAuthPremiumHint')
                  : !biometricHardware
                    ? t('settingsScreen.deviceAuthNoHardwareHint')
                    : t('settingsScreen.deviceAuthHint')}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('settingsScreen.deviceAuth')}
              disabled={deviceAuthSwitchDisabled}
              ios_backgroundColor={isDark ? colors.border : undefined}
              onValueChange={(value) => {
                void handleDeviceAuthToggle(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              value={deviceAuthSwitchValue}
            />
          </View>

          {canLockNow ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  lock();
                  router.replace('/lock');
                }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{t('lockApp')}</Text>
                  <Text style={[styles.rowHint, { color: colors.textMuted }]}>{t('settingsScreen.lockNowHint')}</Text>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </Pressable>
            </>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.appearance')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((option, index) => {
            const selected = theme === option.value;
            return (
              <View key={option.value}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setTheme(option.value);
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{t(option.labelKey)}</Text>
                  {selected ? <Check color={colors.primary} size={22} strokeWidth={2.5} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.language')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SUPPORTED_LANGUAGES.map((code, index) => {
            const selected = i18n.language.startsWith(code);
            return (
              <View key={code}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    handleLanguagePress(code);
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{LANGUAGE_LABELS[code]}</Text>
                  {selected ? <Check color={colors.primary} size={22} strokeWidth={2.5} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.premium')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {premium.isPremium ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settingsScreen.premiumActive')}</Text>
            </View>
          ) : (
            <View style={styles.cardBody}>
              <Button onPress={() => router.push('/paywall')} title={t('upgrade')} variant="primary" />
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.about')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settingsScreen.aboutApp')}</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{config.appName}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settingsScreen.aboutVersion')}</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{appVersion}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.more')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardBody}>
            <Button onPress={handleShowOnboardingAgain} title={t('showOnboardingAgain')} variant="secondary" />
          </View>
        </View>

        {__DEV__ ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.developer')}</Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{t('devPremiumToggle')}</Text>
                  <Text style={[styles.rowHint, { color: colors.textMuted }]}>{t('devPremiumHint')}</Text>
                </View>
                <Switch
                  accessibilityLabel={t('devPremiumToggle')}
                  ios_backgroundColor={isDark ? colors.border : undefined}
                  onValueChange={setDevPremiumOverride}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  value={devPremiumOverride}
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
  },
  rowHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  cardBody: {
    padding: 16,
  },
});
