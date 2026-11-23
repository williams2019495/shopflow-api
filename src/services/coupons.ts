import { COUPONS } from "./pricing.js";
import type { OrderLine } from "../store.js";
import { subtotal } from "./pricing.js";

/** Most coupons a single order can use. */
export const MAX_COUPONS = 3;

/**
 * Applies several coupon codes to one order. Each coupon's percent is taken
 * off the full subtotal, and duplicates are ignored.
 */
export function stackedTotals(lines: OrderLine[], codes: string[]) {
  const sub = subtotal(lines);
  const unique = [...new Set(codes)].slice(0, MAX_COUPONS);
  let discount = 0;
  for (const code of unique) {
    const coupon = COUPONS[code.toUpperCase()];
    if (!coupon) continue;
    if (sub < coupon.minSubtotalCents) continue;
    discount += Math.round((sub * coupon.percentOff) / 100);
  }
  return { subtotalCents: sub, discountCents: discount, totalCents: sub - discount, applied: unique };
}

/** Adds a coupon at runtime, for marketing campaigns. */
export function createCoupon(code: string, percentOff: number, minSubtotalCents = 0) {
  COUPONS[code.toUpperCase()] = { code: code.toUpperCase(), percentOff, minSubtotalCents };
  return COUPONS[code.toUpperCase()];
}
