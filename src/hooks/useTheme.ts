import { useColorScheme } from 'react-native';

import { colors, resolveThemePreference, type AppTheme, type ResolvedTheme } from '../constants/colors';
import { useSettingsStore } from '../stores/settings.store';

type UseThemeResult = {
  theme: AppTheme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: (typeof colors)[ResolvedTheme];
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

export const useTheme = (): UseThemeResult => {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const systemColorScheme = useColorScheme();

  const resolvedTheme = resolveThemePreference(theme, systemColorScheme);
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

