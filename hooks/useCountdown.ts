"use client";

import { useEffect, useMemo, useState } from "react";
import type { PricingTimeValue } from "../utils/pricing";

export interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  discountPercentage: number;
}

function parseTargetTime(
  value: PricingTimeValue,
  referenceDate = new Date()
): Date {
  if (value instanceof Date) return new Date(value.getTime());

  const trimmed = value.trim();

  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return new Date(NaN);

  const target = new Date(referenceDate.getTime());
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);

  if (target.getTime() <= referenceDate.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

function calculateState(
  targetTime: Date,
  now: number,
  startTime?: Date
): CountdownState {
  const remainingMs = targetTime.getTime() - now;
  const isExpired = remainingMs <= 0;
  const totalSeconds = Math.floor(Math.max(0, remainingMs) / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let discountPercentage = 0;

  if (startTime) {
    const totalDuration =
      targetTime.getTime() - startTime.getTime();

    if (totalDuration > 0) {
      const elapsed = Math.min(
        totalDuration,
        Math.max(0, now - startTime.getTime())
      );

      discountPercentage = Math.round(
        (elapsed / totalDuration) * 70
      );
    }
  }

  return {
    hours,
    minutes,
    seconds,
    isExpired,
    discountPercentage,
  };
}

/**
 * targetTime may be an ISO timestamp, Date, or local HH:MM.
 * startTime is optional and determines the linear discount progression.
 */
export function useCountdown(
  targetTime: PricingTimeValue,
  startTime?: PricingTimeValue
): CountdownState {
  const initialTarget = useMemo(
    () => parseTargetTime(targetTime),
    [targetTime]
  );

  const initialStart = useMemo(
    () => (startTime ? parseTargetTime(startTime) : undefined),
    [startTime]
  );

  // null on the first render keeps server and client markup deterministic.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, []);

  if (
    now === null ||
    Number.isNaN(initialTarget.getTime())
  ) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      discountPercentage: 0,
    };
  }

  return calculateState(initialTarget, now, initialStart);
}
