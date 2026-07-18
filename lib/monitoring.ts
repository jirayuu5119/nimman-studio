import "server-only";

type LogLevel = "info" | "warn" | "error";

function safeToken(value: string, max = 100) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, max);
}

export function logServerEvent(input: {
  level: LogLevel;
  event: string;
  requestId?: string;
  code?: string;
  durationMs?: number;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const payload = {
    level: input.level,
    event: safeToken(input.event),
    requestId: input.requestId ? safeToken(input.requestId) : undefined,
    code: input.code ? safeToken(input.code) : undefined,
    durationMs: input.durationMs,
    ...input.metadata,
  };
  const serialized = JSON.stringify(payload);
  if (input.level === "error") console.error(serialized);
  else if (input.level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export async function reportOperationalError(input: {
  event: string;
  requestId?: string;
  code: string;
  durationMs?: number;
}) {
  logServerEvent({ level: "error", ...input });

  const webhookUrl = process.env.OPERATIONAL_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = [
    "Nimman Foto operational alert",
    `event: ${safeToken(input.event)}`,
    `code: ${safeToken(input.code)}`,
    input.requestId ? `request: ${safeToken(input.requestId)}` : null,
    typeof input.durationMs === "number"
      ? `duration: ${Math.max(0, Math.round(input.durationMs))}ms`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, allowed_mentions: { parse: [] } }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      logServerEvent({
        level: "warn",
        event: "operational_alert_delivery",
        code: `ALERT_HTTP_${response.status}`,
      });
    }
  } catch {
    logServerEvent({
      level: "warn",
      event: "operational_alert_delivery",
      code: "ALERT_DELIVERY_FAILED",
    });
  }
}
