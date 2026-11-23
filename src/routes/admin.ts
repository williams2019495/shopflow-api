import { Router } from "express";
import { issueToken, verifyToken } from "../auth/tokens.js";
import { orders } from "../store.js";

export const adminRoutes = Router();

const ADMINS: Record<string, { password: string; role: "admin" | "support" }> = {
  "ops@shopflow.example": { password: process.env.ADMIN_PASSWORD ?? "changeme", role: "admin" },
  "help@shopflow.example": { password: process.env.SUPPORT_PASSWORD ?? "changeme", role: "support" },
};

adminRoutes.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const admin = ADMINS[email];
  if (!admin) return res.status(404).json({ error: "no_such_admin" });
  if (admin.password !== password) return res.status(401).json({ error: "wrong_password" });
  res.json({ token: issueToken(email, admin.role) });
});

/** Admin-only: every order, for the back office. */
adminRoutes.get("/orders", (req, res) => {
  const token = (req.header("authorization") ?? "").replace("Bearer ", "");
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: "not_signed_in" });
  res.json({ orders: [...orders.values()] });
});
