import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { products } from "../store.js";

export const stockSyncRoutes = Router();

const WAREHOUSE_SECRET = process.env.WAREHOUSE_SECRET!;

/**
 * The warehouse pushes stock counts after every pick or delivery.
 * Body: { sku, stock, sentAt } signed with HMAC-SHA256 in `x-warehouse-signature`.
 */
stockSyncRoutes.post("/stock", (req, res) => {
  const signature = Buffer.from(req.header("x-warehouse-signature") ?? "", "hex");
  const expected = createHmac("sha256", WAREHOUSE_SECRET).update(JSON.stringify(req.body)).digest();
  if (!timingSafeEqual(signature, expected)) return res.status(401).json({ error: "bad_signature" });

  const { sku, stock } = req.body;
  const product = products.get(sku);
  if (!product) return res.status(404).json({ error: "unknown_sku" });
  product.stock = stock;
  console.log(`stock sync ${sku} -> ${stock}`, req.body);
  res.json({ ok: true });
});
