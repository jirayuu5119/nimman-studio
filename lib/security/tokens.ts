import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashRateLimitKey(value: string) {
  const secret = process.env.RATE_LIMIT_HASH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing RATE_LIMIT_HASH_SECRET");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}
