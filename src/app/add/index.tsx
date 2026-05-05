import { router } from 'expo-router';
import { ChevronRight, Keyboard, QrCode } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumBadge } from '../../components/ui/PremiumBadge';
import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';

export default function AddAccountMenuScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { canAddCode, canScanQr } = usePremium();

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const openPaywall = useCallback(() => {
    router.dismissTo('/(tabs)');
    router.push('/paywall');
  }, []);

  const handleScanQr = useCallback(() => {
    if (canScanQr) {
      router.push('/add/scan');
      return;
    }
    openPaywall();
  }, [canScanQr, openPaywall]);

  const handleManualEntry = useCallback(() => {
    if (canAddCode) {
      router.push('/add/manual');
      return;
    }
    openPaywall();
  }, [canAddCode, openPaywall]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClose}>
          <Text style={[styles.toolbarBtn, { color: colors.primary }]}>{t('cancel')}</Text>
        </Pressable>
        <Text style={[styles.toolbarTitle, { color: colors.text }]}>{t('addSheetTitle')}</Text>
        <View style={styles.toolbarSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.intro, { color: colors.textMuted }]}>{t('addAccountSheetIntro')}</Text>

        <View style={styles.options}>
          <Pressable
            accessibilityHint={!canScanQr ? t('scanQrPremiumHint') : undefined}
            accessibilityRole="button"
            onPress={handleScanQr}
            style={({ pressed }) => [
              styles.rowTouchable,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.rowIcon,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <QrCode color={colors.primary} size={26} strokeWidth={2} />
              </View>
              <View style={styles.rowMain}>
                <View style={styles.rowTitleLine}>
                  <Text
                    numberOfLines={1}
                    style={[styles.rowTitle, { color: colors.text, flexShrink: 1 }]}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    {t('scanQr')}
                  </Text>
                  {!canScanQr ? <PremiumBadge label={t('premium')} /> : null}
                </View>
                <Text
                  style={[styles.rowDesc, { color: colors.textMuted }]}
                  {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                >
                  {t('addAccountSheetQrDesc')}
                </Text>
                {!canScanQr ? (
                  <Text
                    style={[styles.rowHint, { color: colors.textMuted }]}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    {t('scanQrPremiumHint')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rowChevron}>
                <ChevronRight color={colors.textMuted} size={22} strokeWidth={2} />
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityHint={!canAddCode ? t('addCodeLimitHint') : undefined}
            accessibilityRole="button"
            onPress={handleManualEntry}
            style={({ pressed }) => [
              styles.rowTouchable,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.rowIcon,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Keyboard color={colors.primary} size={26} strokeWidth={2} />
              </View>
              <View style={styles.rowMain}>
                <View style={styles.rowTitleLine}>
                  <Text
                    numberOfLines={1}
                    style={[styles.rowTitle, { color: colors.text, flexShrink: 1 }]}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    {t('manualEntry')}
                  </Text>
                  {!canAddCode ? <PremiumBadge label={t('premium')} /> : null}
                </View>
                <Text
                  style={[styles.rowDesc, { color: colors.textMuted }]}
                  {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                >
                  {t('addAccountSheetManualDesc')}
                </Text>
                {!canAddCode ? (
                  <Text
                    style={[styles.rowHint, { color: colors.textMuted }]}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    {t('addCodeLimitHint')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rowChevron}>
                <ChevronRight color={colors.textMuted} size={22} strokeWidth={2} />
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexGrow: 1,
    alignSelf: 'stretch',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
  body: {
    padding: 20,
    paddingBottom: 8,
    gap: 16,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
  },
  options: {
    gap: 12,
  },
  rowTouchable: {
    minHeight: 92,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
    minWidth: 0,
    marginRight: 8,
  },
  rowChevron: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
