import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type PinPadProps = {
  pinLength?: number;
  value: string;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
  onSubmit: (pin: string) => void;
};

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinPad({ pinLength = 4, value, disabled = false, onChange, onSubmit }: PinPadProps) {
  const { colors } = useTheme();

  const handlePress = (key: (typeof PIN_KEYS)[number]) => {
    if (disabled || key === '') {
      return;
    }

    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }

    if (value.length >= pinLength) {
      return;
    }

    const nextValue = `${value}${key}`;
    onChange(nextValue);
    if (nextValue.length === pinLength) {
      onSubmit(nextValue);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={`pin-dot-${index}`}
            style={[
              styles.dot,
              {
                borderColor: colors.border,
                backgroundColor: index < value.length ? colors.primary : 'transparent',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.grid}>
        {PIN_KEYS.map((key, index) => (
          <Pressable
            key={`pin-key-${index}`}
            accessibilityRole="button"
            disabled={disabled || key === ''}
            onPress={() => handlePress(key)}
            style={({ pressed }) => [
              styles.key,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {key === 'del' ? (
              <Text style={[styles.keyText, { color: colors.textMuted }]}>Del</Text>
            ) : (
              <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
