import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const INITIALS_PALETTE = [
  '#334155',
  '#374151',
  '#1f2937',
  '#475569',
  '#52525b',
  '#0f766e',
  '#1d4ed8',
  '#7c3aed',
] as const;

type InitialsAvatarProps = {
  issuer: string;
  size?: number;
};

const hashStringToIndex = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const getInitials = (issuer: string): string => {
  const trimmed = issuer.trim();
  if (!trimmed) {
    return '?';
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
};

function InitialsAvatarBase({ issuer, size = 32 }: InitialsAvatarProps) {
  const normalizedIssuer = issuer.trim().toLowerCase();
  const colorIndex = hashStringToIndex(normalizedIssuer) % INITIALS_PALETTE.length;
  const initials = useMemo(() => getInitials(issuer), [issuer]);
  const fontSize = Math.max(12, Math.floor(size * 0.42));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.25),
          backgroundColor: INITIALS_PALETTE[colorIndex],
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.text, { fontSize }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export const InitialsAvatar = memo(InitialsAvatarBase);
