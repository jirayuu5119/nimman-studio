import type { BookingStatus } from "@/types/booking";

export const OCCUPYING_BOOKING_STATUSES = [
  "pending",
  "paid",
  "confirmed",
  "completed",
] as const satisfies readonly BookingStatus[];

const ADMIN_STATUS_TRANSITIONS: Partial<
  Record<BookingStatus, readonly BookingStatus[]>
> = {
  pending: ["confirmed", "cancelled"],
  paid: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
};

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus
) {
  return ADMIN_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
