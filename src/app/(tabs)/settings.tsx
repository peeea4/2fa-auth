import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore, useSettingsStore } from '../../stores';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const lock = useAuthStore((state) => state.lock);
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);
  const devPremiumOverride = useSettingsStore((state) => state.devPremiumOverride);
  const setDevPremiumOverride = useSettingsStore((state) => state.setDevPremiumOverride);

  const handleShowOnboardingAgain = () => {
    setOnboardingCompleted(false);
    // Явный маршрут: replace('/') из табов не всегда снова монтирует app/index,
    // из‑за чего редирект на онбординг по флагу не срабатывает.
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>

        <View style={styles.actions}>
          <Button onPress={lock} title={t('lockApp')} variant="primary" />
          <Button onPress={handleShowOnboardingAgain} title={t('showOnboardingAgain')} variant="secondary" />
        </View>

        {__DEV__ ? (
          <View
            style={[
              styles.devCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.devRow}>
              <View style={styles.devLabels}>
                <Text style={[styles.devTitle, { color: colors.text }]}>{t('devPremiumToggle')}</Text>
                <Text style={[styles.devHint, { color: colors.textMuted }]}>{t('devPremiumHint')}</Text>
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
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
  devCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  devLabels: {
    flex: 1,
    gap: 4,
  },
  devTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  devHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
