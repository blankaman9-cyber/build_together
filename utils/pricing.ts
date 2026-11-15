/**
 * Dynamic surplus-food & near-expiry inventory pricing.
 *
 * 1. Closing Time Mode: Price decreases linearly as closing hour approaches (up to 70% off).
 * 2. Expiry Date Mode: For snacks, cold drinks & packaged stock, price drops dynamically
 *    based on days/hours remaining until the expiry date.
 */

export type PricingTimeValue = string | Date;

export interface PricePoint {
  timeLabel: string;
  timeFormatted: string;
  timestamp: number;
  price: number;
  discountPercent: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

const MIN_PRICE_RATIO = 0.3;
const MAX_DISCOUNT_PERCENTAGE = 70;

export function parseTime(value: PricingTimeValue, referenceDate?: Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date value.");
    return new Date(value.getTime());
  }

  const trimmed = value.trim();

  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) throw new Error(`Invalid time value: ${value}`);

  const base = referenceDate ? new Date(referenceDate.getTime()) : new Date();
  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid local time value: ${value}`);
  }

  base.setHours(hours, minutes, 0, 0);
  return base;
}

export function resolveClosingTime(
  createdAt: Date,
  closingTime: PricingTimeValue
): Date {
  if (
    typeof closingTime === "string" &&
    /^\d{1,2}:\d{2}$/.test(closingTime.trim())
  ) {
    const resolved = parseTime(closingTime, createdAt);

    if (resolved.getTime() <= createdAt.getTime()) {
      resolved.setDate(resolved.getDate() + 1);
    }

    return resolved;
  }

  return parseTime(closingTime);
}

/**
 * Calculates dynamic price for near-expiry snacks, drinks and groceries
 */
export function calculateExpiryPrice(
  originalPrice: number,
  expiryDateStr: string,
  nowTimestamp: number = Date.now()
): { price: number; discountPercent: number; daysRemaining: number } {
  const expiryDate = new Date(expiryDateStr);
  // Set to end of expiry day if only date is passed
  if (!expiryDateStr.includes('T')) {
    expiryDate.setHours(23, 59, 59, 999);
  }

  const diffMs = expiryDate.getTime() - nowTimestamp;
  const hoursRemaining = diffMs / (1000 * 3600);
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));

  let discountPercent = 25;
  if (hoursRemaining <= 12) {
    discountPercent = 70; // Expiring today flash markdown
  } else if (hoursRemaining <= 24) {
    discountPercent = 60; // Expiring in 24 hours
  } else if (hoursRemaining <= 48) {
    discountPercent = 45; // Expiring in 2 days
  } else if (hoursRemaining <= 72) {
    discountPercent = 35; // Expiring in 3 days
  }

  const price = Math.round(originalPrice * (1 - discountPercent / 100));
  const floorPrice = Math.round(originalPrice * MIN_PRICE_RATIO);

  return {
    price: Math.max(floorPrice, price),
    discountPercent,
    daysRemaining,
  };
}

/**
 * Calculates current dynamic price (supports both closing time & near-expiry modes)
 */
export function calculateCurrentPrice(
  originalPrice: number,
  createdAt: PricingTimeValue,
  closingTime: PricingTimeValue,
  nowTimestamp: number = Date.now(),
  expiryDate?: string
): number {
  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    throw new Error("originalPrice must be a finite non-negative number.");
  }

  if (originalPrice === 0) return 0;

  if (expiryDate) {
    return calculateExpiryPrice(originalPrice, expiryDate, nowTimestamp).price;
  }

  const createdDate = parseTime(createdAt);
  const closingDate = resolveClosingTime(createdDate, closingTime);
  const totalDuration = closingDate.getTime() - createdDate.getTime();

  if (totalDuration <= 0) {
    return Math.round(originalPrice * MIN_PRICE_RATIO);
  }

  const elapsed = nowTimestamp - createdDate.getTime();
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
  const discount = progress * MAX_DISCOUNT_PERCENTAGE;

  const floorPrice = originalPrice * MIN_PRICE_RATIO;
  const price = originalPrice * (1 - discount / 100);

  return Math.round(Math.max(floorPrice, price));
}

/**
 * Generates the price timeline / markdown history graph points for a listing.
 */
export function getPriceHistoryAndSchedule(
  originalPrice: number,
  createdAt: PricingTimeValue,
  closingTime: PricingTimeValue,
  steps: number = 6,
  expiryDate?: string
): {
  points: PricePoint[];
  currentPrice: number;
  currentDiscount: number;
  floorPrice: number;
  originalPrice: number;
  closingDate: Date;
  createdDate: Date;
  isExpiryMode: boolean;
} {
  const now = Date.now();
  const floorPrice = Math.round(originalPrice * MIN_PRICE_RATIO);

  if (expiryDate) {
    // Generate Expiry Timeline (Days leading up to Expiry Date)
    const expiryDateObj = new Date(expiryDate);
    if (!expiryDate.includes('T')) expiryDateObj.setHours(23, 59, 59, 999);
    const createdDate = parseTime(createdAt);

    const points: PricePoint[] = [];
    const totalDays = 4;

    for (let i = 0; i < totalDays; i++) {
      const daysBefore = totalDays - 1 - i;
      const pointTime = expiryDateObj.getTime() - daysBefore * 86400 * 1000;
      const pointDate = new Date(pointTime);
      const formattedDate = pointDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      let discount = 25;
      if (daysBefore === 0) discount = 70;
      else if (daysBefore === 1) discount = 55;
      else if (daysBefore === 2) discount = 40;

      const price = Math.round(originalPrice * (1 - discount / 100));
      const isPast = pointTime < now - 43200 * 1000;
      const isFuture = pointTime > now + 43200 * 1000;
      const isCurrent = !isPast && !isFuture;

      let label = formattedDate;
      if (daysBefore === 0) label = `Expires (${formattedDate})`;
      else if (daysBefore === 1) label = `1d Left (${formattedDate})`;

      points.push({
        timeLabel: label,
        timeFormatted: formattedDate,
        timestamp: pointTime,
        price: Math.max(floorPrice, price),
        discountPercent: discount,
        isPast,
        isCurrent,
        isFuture,
      });
    }

    const currentExpiry = calculateExpiryPrice(originalPrice, expiryDate, now);

    return {
      points,
      currentPrice: currentExpiry.price,
      currentDiscount: currentExpiry.discountPercent,
      floorPrice,
      originalPrice,
      closingDate: expiryDateObj,
      createdDate,
      isExpiryMode: true,
    };
  }

  // Hourly Closing Time Mode
  const createdDate = parseTime(createdAt);
  const closingDate = resolveClosingTime(createdDate, closingTime);
  const totalDuration = Math.max(1, closingDate.getTime() - createdDate.getTime());

  const currentPrice = calculateCurrentPrice(originalPrice, createdAt, closingTime, now);
  const currentDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

  const points: PricePoint[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const pointTime = createdDate.getTime() + ratio * totalDuration;
    const pointDate = new Date(pointTime);
    
    const hours = pointDate.getHours();
    const minutes = pointDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeFormatted = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;

    let timeLabel = timeFormatted;
    if (i === 0) timeLabel = `Listed (${timeFormatted})`;
    else if (i === steps - 1) timeLabel = `Closing (${timeFormatted})`;

    const discountPercent = Math.round(ratio * MAX_DISCOUNT_PERCENTAGE);
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    const isPast = pointTime < now - (totalDuration / steps) * 0.5;
    const isFuture = pointTime > now + (totalDuration / steps) * 0.5;
    const isCurrent = !isPast && !isFuture;

    points.push({
      timeLabel,
      timeFormatted,
      timestamp: pointTime,
      price: Math.max(floorPrice, price),
      discountPercent,
      isPast,
      isCurrent,
      isFuture,
    });
  }

  const hasCurrent = points.some((p) => p.isCurrent);
  if (!hasCurrent) {
    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((p, index) => {
      const diff = Math.abs(p.timestamp - now);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    points[closestIndex].isCurrent = true;
    points[closestIndex].isPast = false;
    points[closestIndex].isFuture = false;
  }

  return {
    points,
    currentPrice,
    currentDiscount,
    floorPrice,
    originalPrice,
    closingDate,
    createdDate,
    isExpiryMode: false,
  };
}
