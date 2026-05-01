import { useEffect, useMemo, useRef, useState } from 'react';

import { config } from '../constants';
import type { OtpPeriod } from '../types';

type UseOtpTimerOptions = {
  period?: OtpPeriod;
  isEnabled?: boolean;
};

export type UseOtpTimerResult = {
  timeLeft: number;
  progress: number;
  shouldRefresh: boolean;
  currentSlot: number;
};

const getRemainingSeconds = (period: number, nowMs: number): number => {
  const elapsedSeconds = Math.floor(nowMs / 1000);
  const remainder = elapsedSeconds % period;
  return remainder === 0 ? period : period - remainder;
};

export const useOtpTimer = (options: UseOtpTimerOptions = {}): UseOtpTimerResult => {
  const period = options.period ?? config.defaultOtpPeriod;
  const isEnabled = options.isEnabled ?? true;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const lastSlotRef = useRef(Math.floor(Date.now() / 1000 / period));

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const currentNow = Date.now();
      const nextSlot = Math.floor(currentNow / 1000 / period);

      setShouldRefresh(nextSlot !== lastSlotRef.current);
      lastSlotRef.current = nextSlot;
      setNowMs(currentNow);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [period, isEnabled]);

  useEffect(() => {
    lastSlotRef.current = Math.floor(nowMs / 1000 / period);
  }, [period, nowMs]);

  const timeLeft = useMemo(() => getRemainingSeconds(period, nowMs), [period, nowMs]);
  const progress = useMemo(() => (period - timeLeft) / period, [period, timeLeft]);
  const currentSlot = useMemo(() => Math.floor(nowMs / 1000 / period), [nowMs, period]);

  return {
    timeLeft,
    progress,
    shouldRefresh,
    currentSlot,
  };
};
