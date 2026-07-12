import { isIP } from "node:net";

export function getClientIpFromHeaders(headers: Headers) {
  const candidates = [
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    headers.get("x-real-ip")?.trim(),
  ];

  return candidates.find((candidate) => candidate && isIP(candidate)) ?? "unknown";
}
