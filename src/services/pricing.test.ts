import { describe, expect, it } from "vitest";
import { discountFor, subtotal, totals } from "./pricing.js";

const lines = [
  { productId: "a", quantity: 2, unitPriceCents: 1400 },
  { productId: "b", quantity: 1, unitPriceCents: 3200 },
];

describe("pricing", () => {
  it("adds up the lines", () => {
    expect(subtotal(lines)).toBe(6000);
  });

  it("applies a coupon by percent, case-insensitive", () => {
    expect(discountFor("welcome10", 6000)).toBe(600);
  });

  it("ignores a coupon below its minimum", () => {
    expect(discountFor("BIGBASKET", 6000)).toBe(0);
  });

  it("ignores an unknown coupon", () => {
    expect(discountFor("NOPE", 6000)).toBe(0);
  });

  it("returns subtotal, discount and total", () => {
    expect(totals(lines, "WELCOME10")).toEqual({ subtotalCents: 6000, discountCents: 600, totalCents: 5400 });
  });
});
