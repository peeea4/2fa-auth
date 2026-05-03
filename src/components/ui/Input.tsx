import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input({ label, hint, error, style, ...props }, ref) {
  const { colors } = useTheme();
  const helperText = error ?? hint;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  helper: {
    fontSize: 13,
  },
});
