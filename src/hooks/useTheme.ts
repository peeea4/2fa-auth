import { useColorScheme } from 'react-native';

import { colors } from '../constants/colors';
import { useSettingsStore, type AppTheme } from '../stores/settings.store';

type ResolvedTheme = 'light' | 'dark';

type UseThemeResult = {
  theme: AppTheme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: (typeof colors)[ResolvedTheme];
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const getResolvedTheme = (theme: AppTheme, systemColorScheme: 'light' | 'dark' | null | undefined): ResolvedTheme => {
  if (theme === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }

  return theme;
};

export const useTheme = (): UseThemeResult => {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const systemColorScheme = useColorScheme();

  const resolvedTheme = getResolvedTheme(theme, systemColorScheme);
  const isDark = resolvedTheme === 'dark';

  return {
    theme,
    resolvedTheme,
    isDark,
    colors: colors[resolvedTheme],
    setTheme,
    toggleTheme: () => {
      setTheme(isDark ? 'light' : 'dark');
    },
  };
};

