import type { BookingData } from "@/types/booking";

export function isStep1Completed(booking: BookingData): boolean {
  return (
    booking.date !== null &&
    booking.period !== null &&
    booking.package !== null
  );
}

export function isStep2Completed(booking: BookingData): boolean {
  const c = booking.customer;

  return (
    c.fullname.trim() !== "" &&
    c.phone.trim() !== "" &&
    c.line.trim() !== "" &&
    c.university.trim() !== "" &&
    c.faculty.trim() !== ""
  );
}

export function isReadyForPayment(
  booking: BookingData
): boolean {
  return (
    isStep1Completed(booking) &&
    isStep2Completed(booking) &&
    booking.totalPrice > 0
  );
}