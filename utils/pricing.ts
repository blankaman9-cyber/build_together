/**
 * Dynamic surplus-food pricing.
 *
 * Price starts at the original price and decreases linearly until closing.
 * The maximum discount is 70%, so the price never falls below 30% of the
 * original price.
 */

export type PricingTimeValue = string | Date;

const MIN_PRICE_RATIO = 0.3;
const MAX_DISCOUNT_PERCENTAGE = 70;

function parseTime(value: PricingTimeValue, referenceDate?: Date): Date {
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

function resolveClosingTime(
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
 * Calculates the current dynamic price for a listing.
 *
 * 0% discount at creation, increasing linearly to 70% at closing.
 * The price is clamped to a minimum of 30% of originalPrice.
 */
export function calculateCurrentPrice(
  originalPrice: number,
  createdAt: PricingTimeValue,
  closingTime: PricingTimeValue
): number {
  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    throw new Error("originalPrice must be a finite non-negative number.");
  }

  if (originalPrice === 0) return 0;

  const createdDate = parseTime(createdAt);
  const closingDate = resolveClosingTime(createdDate, closingTime);
  const totalDuration =
    closingDate.getTime() - createdDate.getTime();

  if (totalDuration <= 0) {
    return Math.round(originalPrice * MIN_PRICE_RATIO * 100) / 100;
  }

  const elapsed = Date.now() - createdDate.getTime();
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
  const discount = progress * MAX_DISCOUNT_PERCENTAGE;

  const floorPrice = originalPrice * MIN_PRICE_RATIO;
  const price = originalPrice * (1 - discount / 100);

  return Math.round(Math.max(floorPrice, price) * 100) / 100;
}
