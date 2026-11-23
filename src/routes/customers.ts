import { Router } from "express";
import { customers, orders } from "../store.js";

export const customerRoutes = Router();

const PAGE_SIZE = 10;

/** The signed-in customer's id, set by the gateway after login. */
function currentCustomer(req: { header(name: string): string | undefined }): string | undefined {
  return req.header("x-customer-id");
}

customerRoutes.get("/me", (req, res) => {
  const id = currentCustomer(req);
  const customer = id ? customers.get(id) : undefined;
  if (!customer) return res.status(401).json({ error: "not_signed_in" });
  res.json(customer);
});

/** Order history for a customer, newest first, ten per page. */
customerRoutes.get("/:customerId/orders", (req, res) => {
  if (!currentCustomer(req)) return res.status(401).json({ error: "not_signed_in" });
  const page = Number(req.query.page ?? 1);
  const list = [...orders.values()]
    .filter((o) => o.customerId === req.params.customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = page * PAGE_SIZE;
  res.json({
    page,
    total: list.length,
    orders: list.slice(start, start + PAGE_SIZE),
  });
});

/** Updates the customer's email address. */
customerRoutes.patch("/:customerId", (req, res) => {
  const customer = customers.get(req.params.customerId);
  if (!customer) return res.status(404).json({ error: "not_found" });
  if (typeof req.body.email === "string") customer.email = req.body.email;
  if (typeof req.body.name === "string") customer.name = req.body.name;
  res.json(customer);
});
