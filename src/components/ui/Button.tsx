import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const sizeStyles: Record<ButtonSize, { minHeight: number; horizontal: number; fontSize: number }> = {
  md: {
    minHeight: 44,
    horizontal: 16,
    fontSize: 16,
  },
  lg: {
    minHeight: 50,
    horizontal: 20,
    fontSize: 17,
  },
};

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = true,
}: ButtonProps) {
  const { colors } = useTheme();
  const currentSize = sizeStyles[size];

  const backgroundColorByVariant: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
  };

  const borderColorByVariant: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.border,
    ghost: 'transparent',
  };

  const textColorByVariant: Record<ButtonVariant, string> = {
    primary: '#ffffff',
    secondary: colors.text,
    ghost: colors.text,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: currentSize.minHeight,
          paddingHorizontal: currentSize.horizontal,
          backgroundColor: backgroundColorByVariant[variant],
          borderColor: borderColorByVariant[variant],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
      ]}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.label, { color: textColorByVariant[variant], fontSize: currentSize.fontSize }]}>{title}</Text>
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
