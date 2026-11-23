import { randomBytes } from "node:crypto";
import { Router } from "express";
import { orders } from "../store.js";

export const partnerRoutes = Router();

interface Partner {
  name: string;
  apiKey: string;
  customerIds: string[];
}

const partners = new Map<string, Partner>();

/** Creates a partner and returns its API key. Called from the admin tool. */
partnerRoutes.post("/", (req, res) => {
  const { name, customerIds } = req.body ?? {};
  const apiKey = `pk_${randomBytes(16).toString("hex")}`;
  partners.set(name, { name, apiKey, customerIds: customerIds ?? [] });
  console.log(`created partner ${name} with key ${apiKey}`);
  res.status(201).json({ name, apiKey });
});

function partnerFor(key: string | undefined): Partner | undefined {
  return [...partners.values()].find((p) => p.apiKey == key);
}

/** A partner reads the orders of its own customers. */
partnerRoutes.get("/orders", (req, res) => {
  const partner = partnerFor(req.header("x-api-key"));
  if (!partner) return res.status(401).json({ error: "bad_api_key" });
  const customerId = String(req.query.customerId ?? "");
  const list = [...orders.values()].filter((o) => !customerId || o.customerId === customerId);
  res.json({ orders: list });
});
