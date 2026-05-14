import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type TooltipHintProps = {
  message: string;
  onDismiss: () => void;
};

export function TooltipHint({ message, onDismiss }: TooltipHintProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      <Pressable
        accessibilityLabel={t('coachMarkDismiss')}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDismiss}
        style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={[styles.ctaLabel, { color: colors.primary }]}>{t('coachMarkDismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  cta: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
