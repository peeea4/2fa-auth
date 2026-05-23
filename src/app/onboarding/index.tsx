import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingSlider } from '../../components/onboarding';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores';

export default function OnboardingScreen() {
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <OnboardingSlider
        onComplete={() => {
          setOnboardingCompleted(true);
          router.replace('/paywall');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
