import "server-only";

import { sendTelegramMessage } from "@/lib/notifications/telegram";

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

type OperationalErrorInput = {
  event: string;
  requestId?: string;
  code: string;
  durationMs?: number;
};

export function buildOperationalAlertMessage(input: OperationalErrorInput) {
  return [
    "Nimman Foto operational alert",
    `event: ${safeToken(input.event)}`,
    `code: ${safeToken(input.code)}`,
    input.requestId ? `request: ${safeToken(input.requestId)}` : null,
    typeof input.durationMs === "number"
      ? `duration: ${Math.max(0, Math.round(input.durationMs))}ms`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);
}

export async function reportOperationalError(input: OperationalErrorInput) {
  logServerEvent({ level: "error", ...input });
  const result = await sendTelegramMessage(buildOperationalAlertMessage(input));
  if (!result.ok) {
    logServerEvent({
      level: "warn",
      event: "operational_alert_delivery",
      requestId: input.requestId,
      code: result.code,
    });
  }
}
