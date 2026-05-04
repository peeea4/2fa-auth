import { Lock } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import type { OtpEntry } from '../../types';
import { isOtpListCardLocked } from '../../utils/premium-gating';
import { OtpCard } from './OtpCard';

type OtpListProps = {
  entries: OtpEntry[];
  secretsById: Record<string, string | null | undefined>;
  isPremium: boolean;
  onLongPressEntry: (entry: OtpEntry) => void;
  onLockedCardPress: () => void;
  /** Space for tab bar + FAB (default only suits FAB). */
  listBottomInset?: number;
};

export function OtpList({
  entries,
  secretsById,
  isPremium,
  onLongPressEntry,
  onLockedCardPress,
  listBottomInset = 100,
}: OtpListProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const renderItem: ListRenderItem<OtpEntry> = useCallback(
    ({ item, index }) => {
      const isLocked = isOtpListCardLocked(isPremium, index);
      const secret = isLocked ? null : (secretsById[item.id] ?? null);

      return (
        <Pressable
          accessibilityRole="button"
          delayLongPress={380}
          onLongPress={() => {
            onLongPressEntry(item);
          }}
          style={styles.cardWrap}
        >
          <OtpCard entry={item} secret={secret} />
          {isLocked ? (
            <Pressable
              accessibilityHint={t('lockedCardHint')}
              accessibilityRole="button"
              delayLongPress={380}
              onLongPress={() => {
                onLongPressEntry(item);
              }}
              onPress={onLockedCardPress}
              style={[styles.lockOverlay, { backgroundColor: `${colors.background}CC` }]}
            >
              <View style={[styles.lockBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock color={colors.textMuted} size={28} strokeWidth={2} />
                <Text style={[styles.lockLabel, { color: colors.text }]}>{t('premium')}</Text>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      );
    },
    [colors, isPremium, onLockedCardPress, onLongPressEntry, secretsById, t],
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.listContent, { paddingBottom: listBottomInset }]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  cardWrap: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  separator: {
    height: 12,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  lockLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
