import type { BookingData } from "@/types/booking";

export function isStep1Completed(booking: BookingData): boolean {
  return (
    booking.date !== null &&
    booking.period !== null &&
    booking.hours !== null
  );
}

export function isStep2Completed(booking: BookingData): boolean {
  return (
    booking.fullname.trim() !== "" &&
    booking.phone.trim() !== "" &&
    booking.university.trim() !== "" &&
    booking.faculty.trim() !== ""
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