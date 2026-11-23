import { Router } from "express";
import { customers } from "../store.js";

export const passwordResetRoutes = Router();

interface ResetRequest {
  customerId: string;
  createdAt: number;
}

const resets = new Map<string, ResetRequest>();
const passwords = new Map<string, string>();

function newToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sendEmail(to: string, subject: string, body: string) {
  console.log(`email to ${to}: ${subject}\n${body}`);
}

/** Step 1: the customer asks for a reset link. */
passwordResetRoutes.post("/request", (req, res) => {
  const email = String(req.body?.email ?? "");
  const customer = [...customers.values()].find((c) => c.email === email);
  if (!customer) return res.status(404).json({ error: "no_account_for_email" });
  const token = newToken();
  resets.set(token, { customerId: customer.id, createdAt: Date.now() });
  sendEmail(email, "Reset your password", `https://shopflow.example/reset?token=${token}`);
  res.json({ sent: true });
});

/** Step 2: the customer follows the link and picks a new password. */
passwordResetRoutes.post("/confirm", (req, res) => {
  const { token, password } = req.body ?? {};
  const reset = resets.get(token);
  if (!reset) return res.status(400).json({ error: "invalid_token" });
  if (typeof password !== "string" || password.length < 6) return res.status(400).json({ error: "weak_password" });
  passwords.set(reset.customerId, password);
  res.json({ reset: true });
});
