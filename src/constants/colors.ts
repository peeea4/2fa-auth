/**
 * Design tokens: semantic colors for StyleSheet usage and RGB channels
 * for Tailwind / NativeWind (see root `global.css` — keep channel values in sync).
 */

/** Persisted user choice (settings). */
export type ThemePreference = 'light' | 'dark' | 'system';

/** After resolving `system` against the OS color scheme. */
export type ResolvedTheme = 'light' | 'dark';

/** Alias used across stores and UI (same as ThemePreference). */
export type AppTheme = ThemePreference;

export type SemanticColors = {
  background: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  /** Focus rings, key accents */
  ring: string;
};

export const colors: Record<ResolvedTheme, SemanticColors> = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#475569',
    border: '#E2E8F0',
    primary: '#2563EB',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    ring: '#2563EB',
  },
  dark: {
    background: '#0C0C14',
    surface: '#141421',
    surface2: '#1C1C2E',
    text: '#EDEDF5',
    textMuted: '#7878A0',
    border: '#26263A',
    primary: '#7C6FF7',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    ring: '#7C6FF7',
  },
};

/**
 * Space-separated RGB channels (0–255) for `rgb(var(--token) / <alpha-value>)`
 * in Tailwind — must match `global.css` `:root` / `.dark` blocks.
 */
export const themeRgbChannels: Record<ResolvedTheme, Record<keyof SemanticColors, string>> = {
  light: {
    background: '248 250 252',
    surface: '255 255 255',
    surface2: '241 245 249',
    text: '15 23 42',
    textMuted: '71 85 105',
    border: '226 232 240',
    primary: '37 99 235',
    success: '22 163 74',
    warning: '217 119 6',
    danger: '220 38 38',
    ring: '37 99 235',
  },
  dark: {
    background: '12 12 20',
    surface: '20 20 33',
    surface2: '28 28 46',
    text: '237 237 245',
    textMuted: '120 120 160',
    border: '38 38 58',
    primary: '124 111 247',
    success: '52 211 153',
    warning: '251 191 36',
    danger: '248 113 113',
    ring: '124 111 247',
  },
};

export const resolveThemePreference = (
  preference: ThemePreference,
  systemColorScheme: 'light' | 'dark' | null | undefined,
): ResolvedTheme => {
  if (preference === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
};
