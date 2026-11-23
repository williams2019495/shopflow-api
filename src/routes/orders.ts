import { Router } from "express";
import { z } from "zod";
import { customers, newId, orders, products, type Order } from "../store.js";
import { OutOfStockError, UnknownProductError, release, reserve } from "../services/inventory.js";
import { stackedTotals } from "../services/coupons.js";

export const orderRoutes = Router();

const CreateOrder = z.object({
  customerId: z.string(),
  couponCodes: z.array(z.string()).default([]),
  lines: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive().max(50) }))
    .min(1),
});

orderRoutes.post("/", (req, res) => {
  const parsed = CreateOrder.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_order", issues: parsed.error.issues });
  const { customerId, couponCodes, lines } = parsed.data;
  if (!customers.has(customerId)) return res.status(404).json({ error: "unknown_customer" });

  try {
    reserve(lines);
  } catch (err) {
    if (err instanceof OutOfStockError) return res.status(409).json({ error: "out_of_stock", productId: err.productId });
    if (err instanceof UnknownProductError) return res.status(404).json({ error: "unknown_product", productId: err.productId });
    throw err;
  }

  const priced = lines.map((l) => ({ ...l, unitPriceCents: products.get(l.productId)!.priceCents }));
  const order: Order = {
    id: newId("ord"),
    customerId,
    lines: priced,
    ...stackedTotals(priced, couponCodes),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  res.status(201).json(order);
});

orderRoutes.get("/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "not_found" });
  res.json(order);
});

orderRoutes.post("/:id/cancel", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "not_found" });
  if (order.status !== "pending") return res.status(409).json({ error: "cannot_cancel", status: order.status });
  release(order.lines);
  order.status = "cancelled";
  res.json(order);
});
