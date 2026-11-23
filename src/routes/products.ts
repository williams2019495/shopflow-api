import { Router } from "express";
import { products } from "../store.js";
import { createCoupon } from "../services/coupons.js";

export const productRoutes = Router();

productRoutes.get("/", (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const list = [...products.values()].filter((p) => !category || p.category === category);
  res.json({ products: list });
});

productRoutes.get("/:id", (req, res) => {
  const product = products.get(req.params.id);
  if (!product) return res.status(404).json({ error: "not_found" });
  res.json(product);
});

/** Marketing creates campaign coupons from the admin tool. */
productRoutes.post("/coupons", (req, res) => {
  const { code, percentOff, minSubtotalCents } = req.body ?? {};
  if (typeof code !== "string" || typeof percentOff !== "number") return res.status(400).json({ error: "invalid_coupon" });
  res.status(201).json(createCoupon(code, percentOff, minSubtotalCents));
});
