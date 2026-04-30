export const colors = {
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
  },
} as const;

export type AppTheme = keyof typeof colors;
