import { Crown } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type PremiumBadgeProps = {
  label?: string;
};

export function PremiumBadge({ label = 'Premium' }: PremiumBadgeProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderColor: colors.warning, backgroundColor: `${colors.warning}22` }]}>
      <Crown color={colors.warning} size={14} />
      <Text style={[styles.label, { color: colors.warning }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
