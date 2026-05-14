import { Lock, Pencil, Trash2 } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';

import { useTheme } from '../../hooks/useTheme';
import type { OtpEntry } from '../../types';
import { isOtpListCardLocked } from '../../utils/premium-gating';
import { TooltipHint } from '../ui/TooltipHint';
import { OtpCard } from './OtpCard';

const SWIPE_ACTION_WIDTH = 72;

type OtpListProps = {
  entries: OtpEntry[];
  secretsById: Record<string, string | null | undefined>;
  isPremium: boolean;
  grouped?: boolean;
  onEditEntry: (entry: OtpEntry) => void;
  onDeleteEntry: (entry: OtpEntry) => void;
  onLockedCardPress: () => void;
  onReorderEntries: (entries: OtpEntry[]) => void;
  isDragEnabled?: boolean;
  /** Space for tab bar + FAB (default only suits FAB). */
  listBottomInset?: number;
  /** Однократная подсказка над первой карточкой (свайп для действий). */
  showSwipeCoachMark?: boolean;
  onDismissSwipeCoachMark?: () => void;
};

export function OtpList({
  entries,
  secretsById,
  isPremium,
  grouped = false,
  onEditEntry,
  onDeleteEntry,
  onLockedCardPress,
  onReorderEntries,
  isDragEnabled = true,
  listBottomInset = 100,
  showSwipeCoachMark = false,
  onDismissSwipeCoachMark,
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

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<OtpEntry>) => {
      const index = getIndex() ?? 0;
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

      const coachAboveFirst =
        index === 0 && showSwipeCoachMark && onDismissSwipeCoachMark ? (
          <TooltipHint message={t('coachMarkSwipeHint')} onDismiss={onDismissSwipeCoachMark} />
        ) : null;

      return (
        <ScaleDecorator activeScale={0.985}>
          <View style={styles.swipeItemColumn}>
            {coachAboveFirst}
            <Swipeable
              containerStyle={styles.cardWrap}
              friction={2}
              overshootRight={false}
              overshootFriction={8}
              renderRightActions={renderRightActions(item)}
            >
              <View style={[styles.cardInner, isActive && styles.dragActiveCard]}>
                <OtpCard
                  accessibilityHint={t('swipeableCardHint')}
                  entry={item}
                  onLongPress={
                    isDragEnabled
                      ? () => {
                          drag();
                        }
                      : undefined
                  }
                  secret={secret}
                />
              </View>
            </Swipeable>
          </View>
        </ScaleDecorator>
      );
    },
    [
      colors.background,
      colors.border,
      colors.surface,
      colors.text,
      colors.textMuted,
      isDragEnabled,
      isPremium,
      onDismissSwipeCoachMark,
      onLockedCardPress,
      renderRightActions,
      secretsById,
      showSwipeCoachMark,
      t,
    ],
  );

  return (
    <DraggableFlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.listContent, { paddingBottom: listBottomInset }]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      dragItemOverflow={false}
      onDragEnd={({ data }) => {
        onReorderEntries(data);
      }}
      renderPlaceholder={() => <View style={styles.placeholder} />}
      ListHeaderComponent={
        grouped ? (
          <Text style={[styles.groupHint, { color: colors.textMuted }]}>{t('groupedByCategoryHint')}</Text>
        ) : undefined
      }
      activationDistance={16}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  swipeItemColumn: {
    gap: 0,
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
  dragActiveCard: {
    opacity: 0.96,
  },
  separator: {
    height: 12,
  },
  placeholder: {
    borderRadius: 16,
    height: 96,
    opacity: 0.2,
  },
  groupHint: {
    fontSize: 12,
    marginBottom: 8,
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
