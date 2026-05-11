export type OtpIconPreset = {
  key: string;
  label: string;
  emoji: string;
  color: string;
};

export const OTP_ICON_PRESETS: OtpIconPreset[] = [
  { key: 'generic', label: 'Generic', emoji: '🔐', color: '#6366F1' },
  { key: 'google', label: 'Google', emoji: '🔎', color: '#4285F4' },
  { key: 'github', label: 'GitHub', emoji: '🐙', color: '#0F172A' },
  { key: 'microsoft', label: 'Microsoft', emoji: '🪟', color: '#2563EB' },
  { key: 'apple', label: 'Apple', emoji: '🍎', color: '#111827' },
  { key: 'bank', label: 'Bank', emoji: '🏦', color: '#16A34A' },
  { key: 'work', label: 'Work', emoji: '💼', color: '#7C3AED' },
  { key: 'social', label: 'Social', emoji: '💬', color: '#EC4899' },
];

export const OTP_ICON_PRESETS_BY_KEY = Object.fromEntries(OTP_ICON_PRESETS.map((icon) => [icon.key, icon]));
