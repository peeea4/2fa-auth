import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text
        ellipsizeMode="tail"
        numberOfLines={1}
        style={[styles.title, { color: colors.textMuted }]}
      >
        {title}
      </Text>
      <View style={[styles.rule, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
