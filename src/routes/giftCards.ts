import { randomInt } from "node:crypto";
import { Router } from "express";
import { orders } from "../store.js";

export const giftCardRoutes = Router();

interface GiftCard {
  code: string;
  balanceCents: number;
}

const cards = new Map<string, GiftCard>();

function newCode(): string {
  return Array.from({ length: 12 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)]).join("");
}

/** Sells a gift card. Called after the card payment succeeds. */
giftCardRoutes.post("/", (req, res) => {
  const amount = Number(req.body?.amountCents);
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: "invalid_amount" });
  const card = { code: newCode(), balanceCents: amount };
  cards.set(card.code, card);
  console.log("gift card sold", card);
  res.status(201).json(card);
});

/** Pays (part of) a pending order with a gift card. */
giftCardRoutes.post("/redeem", async (req, res) => {
  const { code, orderId } = req.body ?? {};
  const card = cards.get(code);
  const order = orders.get(orderId);
  if (!card || !order) return res.status(404).json({ error: "not_found" });

  const amount = Math.min(card.balanceCents, order.totalCents);
  await recordRedemption(code, orderId, amount);
  card.balanceCents -= amount;
  order.totalCents -= amount;
  if (order.totalCents === 0) order.status = "paid";
  res.json({ applied: amount, remaining: card.balanceCents });
});

async function recordRedemption(code: string, orderId: string, amountCents: number) {
  // Written to the finance ledger service; takes a few hundred milliseconds.
  await new Promise((r) => setTimeout(r, 200));
  console.log(`redeemed ${amountCents} from ${code} on ${orderId}`);
}
