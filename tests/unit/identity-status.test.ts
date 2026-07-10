import { describe, expect, it } from "vitest";
import { formatBookingNumber, BOOKING_NUMBER_PATTERN } from "@/lib/booking-number";
import { isBookingAccessSessionActive } from "@/lib/booking-session-rules";
import {
  canTransitionBookingStatus,
  OCCUPYING_BOOKING_STATUSES,
} from "@/lib/booking-status";
import {
  isValidLegacyLookupPhone,
  isValidThaiPhone,
  normalizePhone,
} from "@/lib/phone";

describe("phone rules", () => {
  it("normalizes Thai phone numbers", () => {
    expect(normalizePhone("+66 81-234-5678")).toBe("0812345678");
    expect(isValidThaiPhone("081-234-5678")).toBe(true);
    expect(isValidThaiPhone("081234567")).toBe(false);
    expect(isValidLegacyLookupPhone("081234567")).toBe(true);
  });
});

describe("booking identity and status", () => {
  it("formats booking numbers with a padded daily counter", () => {
    const bookingNo = formatBookingNumber("2026-07-10", 12);
    expect(bookingNo).toBe("NF-20260710-0012");
    expect(BOOKING_NUMBER_PATTERN.test(bookingNo)).toBe(true);
  });

  it("uses one canonical occupying status set", () => {
    expect(OCCUPYING_BOOKING_STATUSES).toEqual([
      "pending",
      "paid",
      "confirmed",
      "completed",
    ]);
    expect(canTransitionBookingStatus("pending", "confirmed")).toBe(true);
    expect(canTransitionBookingStatus("confirmed", "completed")).toBe(true);
    expect(canTransitionBookingStatus("completed", "confirmed")).toBe(false);
  });

  it("rejects expired and revoked access sessions", () => {
    const now = new Date("2026-07-10T00:00:00.000Z");
    expect(isBookingAccessSessionActive("2026-07-10T01:00:00.000Z", null, now)).toBe(true);
    expect(isBookingAccessSessionActive("2026-07-09T23:59:59.000Z", null, now)).toBe(false);
    expect(isBookingAccessSessionActive("2026-07-10T01:00:00.000Z", now.toISOString(), now)).toBe(false);
  });
});
