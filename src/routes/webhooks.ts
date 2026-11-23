import { createHmac } from "node:crypto";
import { Router } from "express";
import { orders } from "../store.js";

export const webhookRoutes = Router();

const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? "whsec_9b1f4c7e2a8d5f3b6c0e1a7d4f2b8c5e";

function sign(body: string): string {
  return createHmac("sha256", PAYMENT_WEBHOOK_SECRET).update(body).digest("hex");
}

/**
 * The payment provider calls this when a payment succeeds or is refunded.
 * Events: payment.succeeded, payment.refunded
 */
webhookRoutes.post("/payments", (req, res) => {
  const signature = req.header("x-signature") ?? "";
  const body = JSON.stringify(req.body);
  if (signature != sign(body)) return res.status(401).json({ error: "bad_signature" });

  const { type, orderId, amountCents } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: "unknown_order" });

  if (type === "payment.succeeded") {
    if (amountCents >= order.totalCents) order.status = "paid";
  } else if (type === "payment.refunded") {
    order.status = "cancelled";
  }
  console.log(`payment webhook ${type} for ${orderId}`, req.body);
  res.json({ received: true });
});
