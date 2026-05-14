import { ChevronDown } from 'lucide-react-native';
import { type ReactNode, useCallback } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CollapsibleSectionProps = {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CollapsibleSection({ title, expanded, onToggle, children }: CollapsibleSectionProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  return (
    <View style={styles.outer}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        hitSlop={8}
        onPress={handlePress}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        <ChevronDown
          color={colors.textMuted}
          size={22}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  headerPressed: {
    opacity: 0.72,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    gap: 12,
  },
});
