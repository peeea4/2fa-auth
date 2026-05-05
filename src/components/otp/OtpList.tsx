import { Lock, Pencil, Trash2 } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useTheme } from '../../hooks/useTheme';
import type { OtpEntry } from '../../types';
import { isOtpListCardLocked } from '../../utils/premium-gating';
import { OtpCard } from './OtpCard';

const SWIPE_ACTION_WIDTH = 72;

type OtpListProps = {
  entries: OtpEntry[];
  secretsById: Record<string, string | null | undefined>;
  isPremium: boolean;
  onEditEntry: (entry: OtpEntry) => void;
  onDeleteEntry: (entry: OtpEntry) => void;
  onLockedCardPress: () => void;
  /** Space for tab bar + FAB (default only suits FAB). */
  listBottomInset?: number;
};

export function OtpList({
  entries,
  secretsById,
  isPremium,
  onEditEntry,
  onDeleteEntry,
  onLockedCardPress,
  listBottomInset = 100,
}: OtpListProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const renderRightActions = useCallback(
    (item: OtpEntry) => (_progress: unknown, _drag: unknown, swipeable: Swipeable) => (
      <View style={styles.swipeActions}>
        <Pressable
          accessibilityLabel={t('swipeEdit')}
          accessibilityRole="button"
          onPress={() => {
            swipeable.close();
            onEditEntry(item);
          }}
          style={[styles.swipeBtn, { backgroundColor: colors.primary }]}
        >
          <Pencil color="#ffffff" size={22} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityLabel={t('swipeDelete')}
          accessibilityRole="button"
          onPress={() => {
            swipeable.close();
            onDeleteEntry(item);
          }}
          style={[styles.swipeBtn, { backgroundColor: colors.danger }]}
        >
          <Trash2 color="#ffffff" size={22} strokeWidth={2} />
        </Pressable>
      </View>
    ),
    [colors, onDeleteEntry, onEditEntry, t],
  );

  const renderItem: ListRenderItem<OtpEntry> = useCallback(
    ({ item, index }) => {
      const isLocked = isOtpListCardLocked(isPremium, index);
      const secret = isLocked ? null : (secretsById[item.id] ?? null);

      if (isLocked) {
        return (
          <View style={styles.cardWrap}>
            <OtpCard entry={item} secret={secret} />
            <Pressable
              accessibilityHint={t('lockedCardHint')}
              accessibilityRole="button"
              onPress={onLockedCardPress}
              style={[styles.lockOverlay, { backgroundColor: `${colors.background}CC` }]}
            >
              <View style={[styles.lockBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock color={colors.textMuted} size={28} strokeWidth={2} />
                <Text style={[styles.lockLabel, { color: colors.text }]}>{t('premium')}</Text>
              </View>
            </Pressable>
          </View>
        );
      }

      return (
        <Swipeable
          containerStyle={styles.cardWrap}
          friction={2}
          overshootRight={false}
          overshootFriction={8}
          renderRightActions={renderRightActions(item)}
        >
          <View style={styles.cardInner}>
            <OtpCard entry={item} secret={secret} />
          </View>
        </Swipeable>
      );
    },
    [colors, isPremium, onLockedCardPress, renderRightActions, secretsById, t],
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
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  separator: {
    height: 12,
  },
  swipeActions: {
    flexDirection: 'row',
    height: '100%',
  },
  swipeBtn: {
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
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
