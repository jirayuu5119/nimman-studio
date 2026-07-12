import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/security/request";
import { hashRateLimitKey } from "@/lib/security/tokens";
import { normalizeRateLimitResult } from "@/lib/security/rate-limit-result";

export async function consumeRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
) {
  // The User-Agent is attacker-controlled and must not create a fresh quota.
  // Rate-limit primarily by the platform-provided client IP.
  const keyHash = hashRateLimitKey(getClientIp(request));
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw new Error("RATE_LIMIT_UNAVAILABLE");

  return normalizeRateLimitResult(data);
}
