import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type ThemeRootProps = {
  children: ReactNode;
};

export function ThemeRoot({ children }: ThemeRootProps) {
  const { isDark, theme } = useTheme();

  useLayoutEffect(() => {
    colorScheme.set(theme === 'system' ? 'system' : theme);
  }, [theme]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
