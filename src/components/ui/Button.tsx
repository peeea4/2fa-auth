import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

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

/** minHeight — внешняя высота; padding внутри неё (Yoga), поэтому minHeight ≥ 2·paddingV + зона под строку. */
const sizeStyles: Record<
  ButtonSize,
  { minHeight: number; paddingVertical: number; paddingHorizontal: number; fontSize: number }
> = {
  md: {
    minHeight: 54,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  lg: {
    minHeight: 78,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 17,
  },
};

export function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = true,
}: ButtonProps) {
  const { colors } = useTheme();
  const currentSize = sizeStyles[size];

  const backgroundColorByVariant: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: "transparent",
  };

  const borderColorByVariant: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.border,
    ghost: "transparent",
  };

  const textColorByVariant: Record<ButtonVariant, string> = {
    primary: "#ffffff",
    secondary: colors.text,
    ghost: colors.text,
  };

  const bg = backgroundColorByVariant[variant];
  const border = borderColorByVariant[variant];

  return (
    <View
      style={[
        {
          borderRadius: 12,
          borderWidth: variant === "ghost" ? 0 : 1,
          borderColor: border,
          backgroundColor: bg,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? "100%" : undefined,
          overflow: "hidden",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: currentSize.minHeight,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed && !disabled ? 0.9 : 1,
        })}
      >
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.label,
              { color: textColorByVariant[variant], fontSize: currentSize.fontSize },
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
    textAlign: "center",
  },
});
