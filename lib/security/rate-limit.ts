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
  const userAgent = request.headers.get("user-agent")?.slice(0, 200) ?? "";
  const keyHash = hashRateLimitKey(`${getClientIp(request)}|${userAgent}`);
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
