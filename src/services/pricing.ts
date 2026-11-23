import type { OrderLine } from "../store.js";

export interface Coupon {
  code: string;
  /** Percent off the subtotal, 1 to 100. */
  percentOff: number;
  /** Smallest subtotal the coupon applies to. */
  minSubtotalCents: number;
}

export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { code: "WELCOME10", percentOff: 10, minSubtotalCents: 0 },
  BIGBASKET: { code: "BIGBASKET", percentOff: 15, minSubtotalCents: 10000 },
};

export function subtotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
}

/** Discount in cents for a coupon code, or 0 when the code doesn't apply. */
export function discountFor(code: string | undefined, subtotalCents: number): number {
  if (!code) return 0;
  const coupon = COUPONS[code.toUpperCase()];
  if (!coupon || subtotalCents < coupon.minSubtotalCents) return 0;
  return Math.round((subtotalCents * coupon.percentOff) / 100);
}

export function totals(lines: OrderLine[], couponCode?: string) {
  const sub = subtotal(lines);
  const discount = discountFor(couponCode, sub);
  return { subtotalCents: sub, discountCents: discount, totalCents: sub - discount };
}
