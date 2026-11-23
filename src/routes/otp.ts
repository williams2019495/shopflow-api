import { createHash, randomInt } from "node:crypto";
import { Router } from "express";
import { customers } from "../store.js";

export const otpRoutes = Router();

interface Challenge {
  codeHash: string;
  expiresAt: number;
}

const challenges = new Map<string, Challenge>();
const OTP_TTL_MS = 5 * 60 * 1000;

function hash(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Step 1: send a six-digit sign-in code to the customer's email. */
otpRoutes.post("/start", (req, res) => {
  const email = String(req.body?.email ?? "");
  const customer = [...customers.values()].find((c) => c.email === email);
  if (!customer) return res.status(200).json({ sent: true }); // same answer either way
  const code = String(randomInt(1_000_000)).padStart(6, "0");
  challenges.set(customer.id, { codeHash: hash(code), expiresAt: Date.now() + OTP_TTL_MS });
  console.log(`sign-in code for ${email}: ${code}`);
  res.json({ sent: true });
});

/** Step 2: the customer types the code; we start a session. */
otpRoutes.post("/verify", (req, res) => {
  const { customerId, code } = req.body ?? {};
  const challenge = challenges.get(customerId);
  if (!challenge) return res.status(400).json({ error: "no_challenge" });
  if (hash(String(code)) != challenge.codeHash) return res.status(401).json({ error: "wrong_code" });
  res.json({ signedIn: true, customerId });
});
