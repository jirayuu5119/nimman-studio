import "server-only";

import { randomUUID } from "node:crypto";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { logServerEvent } from "@/lib/monitoring";

export function getRequestId(request: Request) {
  const incoming = request.headers.get("x-request-id");
  return incoming && /^[a-zA-Z0-9._-]{1,100}$/.test(incoming)
    ? incoming
    : randomUUID();
}

export function getClientIp(request: Request) {
  return getClientIpFromHeaders(request.headers);
}

export function logServerError(event: string, requestId: string, code: string) {
  logServerEvent({ level: "error", event, requestId, code });
}
