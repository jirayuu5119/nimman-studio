import type { BookingData } from "@/types/booking";
import { isValidThaiPhone } from "@/lib/phone";

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
    isValidThaiPhone(booking.phone) &&
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
