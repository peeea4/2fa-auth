import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Check, ChevronRight, Lock, Sparkles } from 'lucide-react-native';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import type { AppTheme, SemanticColors } from '../../constants/colors';
import { config } from '../../constants/config';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/resolve-language';
import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { biometricService } from '../../services/biometric.service';
import { useAuthStore, useSettingsStore } from '../../stores';

/** Порядок пунктов в настройках (светлая → тёмная → как в системе). */
const THEME_ORDER: AppTheme[] = ['light', 'dark', 'system'];

const THEME_LABEL_KEY: Record<AppTheme, string> = {
  light: 'settingsScreen.themeLight',
  dark: 'settingsScreen.themeDark',
  system: 'settingsScreen.themeSystem',
};

/** Нативные подписи языков (endonym), не из i18n — так принято в системных списках языков. */
const LANGUAGE_DISPLAY_NAME: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
};

type InsetSelectItem = {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

type SettingsInsetSelectListProps = {
  items: InsetSelectItem[];
  colors: SemanticColors;
};

function SettingsInsetSelectList({ items, colors }: SettingsInsetSelectListProps) {
  return (
    <View style={[styles.card, styles.cardSelectList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 ? <View style={[styles.selectListDivider, { backgroundColor: colors.border }]} /> : null}
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: item.selected }}
            hitSlop={8}
            onPress={item.onSelect}
            style={({ pressed }) => [styles.selectListPressable, pressed && styles.rowPressed]}
          >
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text
                  numberOfLines={2}
                  style={[styles.rowLabel, styles.selectListLabel, { color: colors.text }]}
                  {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                >
                  {item.label}
                </Text>
              </View>
              <View style={styles.rowTrailing}>
                {item.selected ? <Check color={colors.primary} size={22} strokeWidth={2.5} /> : null}
              </View>
            </View>
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, isDark, theme, setTheme } = useTheme();
  const lock = useAuthStore((state) => state.lock);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);
  const storedLanguage = useSettingsStore((state) => state.language);
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

  const handleShowOnboardingAgain = () => {
    setOnboardingCompleted(false);
    router.replace('/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';

  const deviceAuthSwitchDisabled = !canUseBiometric || !biometricHardware;
  const deviceAuthSwitchValue = Boolean(isBiometricEnabled && canUseBiometric);

  const canLockNow = canUseBiometric && isBiometricEnabled;

  const themeSelectItems = useMemo<InsetSelectItem[]>(
    () =>
      THEME_ORDER.map((value) => ({
        id: value,
        label: t(THEME_LABEL_KEY[value]),
        selected: theme === value,
        onSelect: () => {
          setTheme(value);
        },
      })),
    [setTheme, t, theme],
  );

  const languageSelectItems = useMemo<InsetSelectItem[]>(
    () =>
      SUPPORTED_LANGUAGES.map((code) => ({
        id: code,
        label: LANGUAGE_DISPLAY_NAME[code],
        selected: storedLanguage === code || storedLanguage.startsWith(`${code}-`),
        onSelect: () => {
          setLanguage(code);
        },
      })),
    [setLanguage, storedLanguage],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('settings')}</Text>

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
            <View style={styles.rowTrailing}>
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
          </View>

          {canLockNow ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Pressable
                accessibilityHint={t('settingsScreen.lockNowHint')}
                accessibilityLabel={t('lockApp')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  lock();
                  router.replace('/lock');
                }}
                style={({ pressed }) => [styles.selectListPressable, pressed && styles.rowPressed]}
              >
                <View style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{t('lockApp')}</Text>
                    <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                      {t('settingsScreen.lockNowHint')}
                    </Text>
                  </View>
                  <View style={styles.rowTrailing}>
                    <Lock color={colors.primary} size={22} strokeWidth={2.25} />
                  </View>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleList, { color: colors.textMuted }]}>
          {t('settingsScreen.appearance')}
        </Text>
        <SettingsInsetSelectList colors={colors} items={themeSelectItems} />

        <Text style={[styles.sectionTitle, styles.sectionTitleList, { color: colors.textMuted }]}>
          {t('settingsScreen.language')}
        </Text>
        <SettingsInsetSelectList colors={colors} items={languageSelectItems} />

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settingsScreen.more')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardBody}>
            <Button onPress={() => router.push('/backup')} title={t('backup.title')} variant="secondary" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
                <View style={styles.rowTrailing}>
                  <Switch
                    accessibilityLabel={t('devPremiumToggle')}
                    ios_backgroundColor={isDark ? colors.border : undefined}
                    onValueChange={setDevPremiumOverride}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    value={devPremiumOverride}
                  />
                </View>
              </View>
            </View>
          </>
        ) : null}

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

        {!premium.isPremium ? (
          <Pressable
            accessibilityHint={t('settingsScreen.premiumBannerSubtitle')}
            accessibilityLabel={t('settingsScreen.premiumBannerTitle')}
            accessibilityRole="button"
            onPress={() => router.push('/paywall')}
            style={({ pressed }) => [
              styles.premiumBanner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={[styles.premiumBannerIconWrap, { backgroundColor: `${colors.primary}22` }]}>
              <Sparkles color={colors.primary} size={26} strokeWidth={2} />
            </View>
            <View style={styles.premiumBannerTextCol}>
              <Text style={[styles.premiumBannerTitle, { color: colors.text }]}>
                {t('settingsScreen.premiumBannerTitle')}
              </Text>
              <Text style={[styles.premiumBannerSubtitle, { color: colors.textMuted }]}>
                {t('settingsScreen.premiumBannerSubtitle')}
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={22} strokeWidth={2.25} />
          </Pressable>
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
  /** Доп. воздух над карточками выбора (оформление / язык). */
  sectionTitleList: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    gap: 0,
  },
  /** Обрезка разделителей по скруглению; вертикальные поля задаёт только `styles.card`, как у карточки безопасности. */
  cardSelectList: {
    overflow: 'hidden',
  },
  selectListDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  /** `Pressable` по умолчанию ведёт себя как колонка — растягиваем на ширину карточки, строку даём внутреннему `View`. */
  selectListPressable: {
    alignSelf: 'stretch',
  },
  /** Текст в списке выбора: сжатие по ширине, чтобы `rowTrailing` не переносился на новую строку. */
  selectListLabel: {
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
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
    minWidth: 0,
    gap: 4,
    paddingRight: 4,
  },
  /** Фиксированная правая колонка под Switch / Chevron. */
  rowTrailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
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
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  premiumBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumBannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
