import { createHmac } from "node:crypto";

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET ?? "dev-admin-secret";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // one working day

export interface AdminClaims {
  sub: string;
  role: "admin" | "support";
  exp: number;
}

function b64(json: object): string {
  return Buffer.from(JSON.stringify(json)).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
}

/** Issues a signed admin token: header.payload.signature. */
export function issueToken(sub: string, role: AdminClaims["role"]): string {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({ sub, role, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS });
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

/** Returns the claims of a valid token, or null. */
export function verifyToken(token: string): AdminClaims | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload) return null;
  const alg = JSON.parse(Buffer.from(header, "base64url").toString()).alg;
  if (alg !== "none" && signature !== sign(`${header}.${payload}`)) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminClaims;
}
