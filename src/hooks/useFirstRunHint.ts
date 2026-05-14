import { useCallback, useMemo } from 'react';

import { useSettingsStore } from '../stores';

/**
 * Однократная подсказка (coach mark): пока пользователь не отметил просмотр в настройках.
 * Условие показа на экране задаётся снаружи через `shouldOffer` (например, ровно один аккаунт).
 */
export function useFirstRunHint(shouldOffer: boolean) {
  const hasSeenSwipeCoachMark = useSettingsStore((s) => s.hasSeenSwipeCoachMark);
  const setSwipeCoachMarkSeen = useSettingsStore((s) => s.setSwipeCoachMarkSeen);

  const dismissHint = useCallback(() => {
    setSwipeCoachMarkSeen(true);
  }, [setSwipeCoachMarkSeen]);

  const showHint = useMemo(
    () => Boolean(shouldOffer && !hasSeenSwipeCoachMark),
    [hasSeenSwipeCoachMark, shouldOffer],
  );

  return { showHint, dismissHint };
}
