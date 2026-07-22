import { PACKAGES } from "@/lib/packages";
import { getTimeSlots } from "@/lib/timeSlots";
import type { BookingPeriod } from "@/types/booking";

export const DEPOSIT_AMOUNT = 1000;
export const MIN_GRADUATES = 1;
export const MAX_GRADUATES = 5;
export const BOOKING_HORIZON_DAYS = 365;
export const ADMIN_CALENDAR_MAX_DATE = "2100-12-31";

export function calculateBookingPrice(hours: 3 | 4, graduates: number) {
  const packageInfo = PACKAGES[hours];

  if (
    !packageInfo ||
    !Number.isInteger(graduates) ||
    graduates < MIN_GRADUATES ||
    graduates > MAX_GRADUATES
  ) {
    throw new Error("INVALID_BOOKING_PACKAGE");
  }

  const totalPrice =
    packageInfo.basePrice +
    (graduates - 1) * packageInfo.extraGraduatePrice;

  return {
    totalPrice,
    depositAmount: DEPOSIT_AMOUNT,
    remainingAmount: Math.max(totalPrice - DEPOSIT_AMOUNT, 0),
  };
}

export function isSupportedTimeSlot(
  period: BookingPeriod,
  hours: 3 | 4,
  startTime: string,
  endTime: string
) {
  return getTimeSlots(period, hours).some(
    (slot) => slot.startTime === startTime && slot.endTime === endTime
  );
}

export function getBangkokDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isBookableDate(dateKey: string, now = new Date()) {
  if (!isValidDateKey(dateKey)) return false;

  const today = getBangkokDateKey(now);
  return dateKey >= today && dateKey <= addDaysToDateKey(today, BOOKING_HORIZON_DAYS);
}

function isValidDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;

  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateKey;
}

export function isAdminCalendarDate(dateKey: string, now = new Date()) {
  if (!isValidDateKey(dateKey)) return false;

  const today = getBangkokDateKey(now);
  return dateKey >= today && dateKey <= ADMIN_CALENDAR_MAX_DATE;
}
