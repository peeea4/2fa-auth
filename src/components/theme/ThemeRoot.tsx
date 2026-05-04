import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type ThemeRootProps = {
  children: ReactNode;
};

export function ThemeRoot({ children }: ThemeRootProps) {
  const { isDark } = useTheme();

  return (
    <View className={`flex-1 bg-background ${isDark ? 'dark' : ''}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
