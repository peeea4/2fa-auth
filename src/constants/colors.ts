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
    background: '#020617',
    surface: '#0F172A',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#1E293B',
    primary: '#60A5FA',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    ring: '#60A5FA',
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
    background: '2 6 23',
    surface: '15 23 42',
    text: '248 250 252',
    textMuted: '148 163 184',
    border: '30 41 59',
    primary: '96 165 250',
    success: '74 222 128',
    warning: '251 191 36',
    danger: '248 113 113',
    ring: '96 165 250',
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
