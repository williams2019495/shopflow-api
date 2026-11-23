import type { NextFunction, Request, Response } from "express";

/**
 * Lets the storefront (and our preview deployments) call the API from the
 * browser, with the session cookie attached.
 */
export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.header("origin");
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-customer-id");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

/** Starts a storefront session after login. */
export function startSession(res: Response, customerId: string) {
  res.cookie("sf_session", customerId, { maxAge: 30 * 24 * 3600 * 1000 });
}

/** Reads the signed-in customer from the session cookie. */
export function sessionCustomer(req: Request): string | undefined {
  const cookie = req.header("cookie") ?? "";
  const match = cookie.match(/sf_session=([^;]+)/);
  return match?.[1];
}
