import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '../i18n';
import { useAuthStore, useSettingsStore } from '../stores';

export default function RootLayout() {
  const lock = useAuthStore((state) => state.lock);
  const language = useSettingsStore((state) => state.language);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState === 'active' && (nextState === 'inactive' || nextState === 'background')) {
        lock();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [lock]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="setup-pin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
