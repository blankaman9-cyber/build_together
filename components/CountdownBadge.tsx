"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateCurrentPrice,
  type PricingTimeValue,
} from "../utils/pricing";
import { useCountdown } from "../hooks/useCountdown";

export interface CountdownBadgeProps {
  originalPrice: number;
  createdAt: PricingTimeValue;
  closingTime: PricingTimeValue;
  className?: string;
  onPriceUpdate?: (price: number) => void;
}

function formatTime(
  hours: number,
  minutes: number,
  seconds: number
): string {
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function CountdownBadge({
  originalPrice,
  createdAt,
  closingTime,
  className = "",
  onPriceUpdate,
}: CountdownBadgeProps) {
  const countdown = useCountdown(closingTime, createdAt);

  const currentPrice = useMemo(
    () =>
      calculateCurrentPrice(
        originalPrice,
        createdAt,
        closingTime
      ),
    [
      originalPrice,
      createdAt,
      closingTime,
      countdown.discountPercentage,
      countdown.seconds,
    ]
  );

  const [displayPrice, setDisplayPrice] =
    useState(originalPrice);
  const [priceChanged, setPriceChanged] = useState(false);

  useEffect(() => {
    setDisplayPrice((previous) => {
      if (Math.abs(previous - currentPrice) < 0.005) {
        return currentPrice;
      }

      setPriceChanged(true);
      return currentPrice;
    });

    if (onPriceUpdate) {
      onPriceUpdate(currentPrice);
    }
  }, [currentPrice, onPriceUpdate]);

  useEffect(() => {
    if (!priceChanged) return;

    const timeout = window.setTimeout(
      () => setPriceChanged(false),
      450
    );

    return () => window.clearTimeout(timeout);
  }, [priceChanged]);

  const countdownLabel = countdown.isExpired
    ? "Pickup closed"
    : formatTime(
        countdown.hours,
        countdown.minutes,
        countdown.seconds
      );

  const discountLabel = countdown.isExpired
    ? "70% off"
    : `${countdown.discountPercentage}% off`;

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border",
        "border-amber-200/80 bg-amber-50 px-3 py-1.5",
        "text-xs font-semibold text-amber-950 shadow-sm",
        className,
      ].join(" ")}
      aria-label={
        countdown.isExpired
          ? "Pickup closed"
          : `${countdownLabel} remaining, ${discountLabel}`
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
        aria-hidden="true"
      />

      <span className="tabular-nums font-mono font-medium">
        ⏳ {countdownLabel}
      </span>

      <span
        className="h-3 w-px bg-amber-200"
        aria-hidden="true"
      />

      <span className="tabular-nums font-bold text-emerald-700">
        {discountLabel}
      </span>

      {!countdown.isExpired && (
        <span
          className={[
            "tabular-nums font-black text-slate-900",
            "transition-transform duration-300",
            priceChanged ? "scale-110 text-emerald-600" : "scale-100",
          ].join(" ")}
        >
          ₹{displayPrice.toFixed(0)}
        </span>
      )}
    </div>
  );
}
