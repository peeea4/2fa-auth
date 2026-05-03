import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import '../i18n';
import { useAuthStore } from '../stores';

export default function RootLayout() {
  const lock = useAuthStore((state) => state.lock);
  const appStateRef = useRef(AppState.currentState);

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="lock" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
