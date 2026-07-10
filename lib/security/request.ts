import "server-only";

import { randomUUID } from "node:crypto";

export function getRequestId(request: Request) {
  const incoming = request.headers.get("x-request-id");
  return incoming && /^[a-zA-Z0-9._-]{1,100}$/.test(incoming)
    ? incoming
    : randomUUID();
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function logServerError(event: string, requestId: string, code: string) {
  const safeCode = code.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 100);
  console.error(JSON.stringify({ event, requestId, code: safeCode }));
}
