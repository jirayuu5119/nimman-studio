export function isBookingAccessSessionActive(
  expiresAt: string,
  revokedAt: string | null,
  now = new Date()
) {
  if (revokedAt) return false;
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry > now.getTime();
}
