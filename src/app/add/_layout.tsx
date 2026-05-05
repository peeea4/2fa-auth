import { Stack } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';

/**
 * Не перечисляем `<Stack.Screen />` вручную — Expo Router сам подключает
 * `index` / `manual` / `scan`. Лишний вложенный stack + formSheet на iOS
 * часто даёт пустой белый экран.
 */
export default function AddLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: {
          flexGrow: 1,
          flexShrink: 1,
          backgroundColor: colors.background,
        },
      }}
    />
  );
}
