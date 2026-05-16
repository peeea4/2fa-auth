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
        style={({ pressed }) => [styles.headerPressable, pressed && styles.headerPressed]}
      >
        <View style={styles.headerRow}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[styles.title, { color: colors.text }]}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {title}
          </Text>
          <View
            style={[
              styles.chevronWrap,
              { transform: [{ rotate: expanded ? '180deg' : '0deg' }] },
            ]}
          >
            <ChevronDown color={colors.textMuted} size={24} strokeWidth={2} />
          </View>
        </View>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 12,
    alignSelf: 'stretch',
  },
  headerPressable: {
    alignSelf: 'stretch',
    paddingVertical: 4,
  },
  headerPressed: {
    opacity: 0.72,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 12,
  },
});
