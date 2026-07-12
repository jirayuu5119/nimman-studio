export const ADMIN_BOOKING_STATUSES = new Set([
  "all",
  "pending",
  "paid",
  "confirmed",
  "completed",
  "cancelled",
  "draft",
]);

export function normalizeAdminBookingSearch(value: string | null | undefined) {
  return (value ?? "")
    .replace(/[^\p{L}\p{N}\s@._+\-]/gu, " ")
    .trim()
    .slice(0, 100);
}

export function normalizeAdminBookingStatus(
  value: string | null | undefined
) {
  return ADMIN_BOOKING_STATUSES.has(value ?? "all") ? value ?? "all" : "all";
}
