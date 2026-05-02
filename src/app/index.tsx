import { Redirect } from 'expo-router';

import { useAuthStore, useSettingsStore } from '../stores';

export default function AppEntryScreen() {
  const isLocked = useAuthStore((state) => state.isLocked);
  const isOnboardingCompleted = useSettingsStore((state) => state.isOnboardingCompleted);

  if (!isOnboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  if (isLocked) {
    return <Redirect href="/lock" />;
  }

  return <Redirect href="/(tabs)" />;
}
