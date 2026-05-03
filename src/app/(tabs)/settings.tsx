import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore, useSettingsStore } from '../../stores';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const lock = useAuthStore((state) => state.lock);
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);

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
});
