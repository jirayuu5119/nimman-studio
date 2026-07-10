export function normalizeRateLimitResult(
  value: unknown
): { allowed: boolean; retryAfter: number } {
  const record = Array.isArray(value) ? value[0] : value;
  if (!record || typeof record !== "object") {
    return { allowed: false, retryAfter: 1 };
  }

  const allowed = (record as { allowed?: unknown }).allowed === true;
  const rawRetry = Number((record as { retry_after?: unknown }).retry_after ?? 0);
  return {
    allowed,
    retryAfter: allowed ? 0 : Math.max(1, Number.isFinite(rawRetry) ? rawRetry : 1),
  };
}
