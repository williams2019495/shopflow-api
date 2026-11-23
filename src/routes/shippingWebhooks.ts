import { createHmac } from "node:crypto";
import { Router } from "express";
import { orders, products } from "../store.js";

export const shippingWebhookRoutes = Router();

const SHIPPING_SECRET = process.env.SHIPPING_WEBHOOK_SECRET ?? "";

/**
 * Our courier calls this as a parcel moves. Events:
 *  - parcel.shipped   -> mark the order shipped
 *  - parcel.returned  -> the customer sent it back: put the stock back and cancel the order
 * Each request carries `x-courier-signature` (HMAC-SHA256 of the body, hex) and `x-courier-timestamp`.
 */
shippingWebhookRoutes.post("/courier", (req, res) => {
  const signature = req.header("x-courier-signature");
  const expected = createHmac("sha256", SHIPPING_SECRET).update(JSON.stringify(req.body)).digest("hex");
  if (signature !== expected) return res.status(401).json({ error: "bad_signature" });

  const { event, orderId } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: "unknown_order" });

  if (event === "parcel.shipped") {
    order.status = "shipped";
  } else if (event === "parcel.returned") {
    for (const line of order.lines) {
      products.get(line.productId)!.stock += line.quantity;
    }
    order.status = "cancelled";
  }
  res.json({ ok: true });
});
