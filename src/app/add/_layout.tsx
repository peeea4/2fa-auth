import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack>
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="manual" options={{ presentation: 'modal', title: 'Manual Entry' }} />
    </Stack>
  );
}
