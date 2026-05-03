import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingSlider } from '../../components/onboarding';
import { useSettingsStore } from '../../stores';

export default function OnboardingScreen() {
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <OnboardingSlider
        onComplete={() => {
          setOnboardingCompleted(true);
          router.replace('/');
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
