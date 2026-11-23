import express from "express";
import { orderRoutes } from "./routes/orders.js";
import { productRoutes } from "./routes/products.js";
import { customerRoutes } from "./routes/customers.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/products", productRoutes);
  app.use("/orders", orderRoutes);
  app.use("/customers", customerRoutes);
  return app;
}
