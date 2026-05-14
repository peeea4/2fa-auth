import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

export type InputVariant = 'outline' | 'filled';

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  variant?: InputVariant;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, style, variant = 'outline', ...props },
  ref,
) {
  const { colors } = useTheme();
  const helperText = error ?? hint;
  const filled = variant === 'filled';

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          filled ? styles.inputFilled : styles.inputOutline,
          {
            color: colors.text,
            backgroundColor: colors.surface2,
            ...(!filled ? { borderColor: error ? colors.danger : colors.border } : {}),
          },
          style,
        ]}
        {...props}
      />
      {helperText ? (
        <Text style={[styles.helper, { color: error ? colors.danger : colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputOutline: {
    borderWidth: 1,
  },
  inputFilled: {
    borderWidth: 0,
  },
  helper: {
    fontSize: 13,
  },
});
