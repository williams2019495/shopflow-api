import { Router } from "express";
import { products } from "../store.js";

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
