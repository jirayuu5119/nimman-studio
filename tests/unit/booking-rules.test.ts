import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  calculateBookingPrice,
  getBangkokDateKey,
  isAdminCalendarDate,
  isBookableDate,
  isSupportedTimeSlot,
} from "@/lib/booking-rules";
import { bookingInputSchema } from "@/lib/booking-schema";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

describe("booking pricing", () => {
  it("calculates package, extra graduates, deposit, and remaining amount", () => {
    expect(calculateBookingPrice(3, 1)).toEqual({
      totalPrice: 4000,
      depositAmount: 1000,
      remainingAmount: 3000,
    });
    expect(calculateBookingPrice(4, 3)).toEqual({
      totalPrice: 6500,
      depositAmount: 1000,
      remainingAmount: 5500,
    });
  });

  it("rejects graduate counts outside the UI range", () => {
    expect(() => calculateBookingPrice(3, 0)).toThrow();
    expect(() => calculateBookingPrice(4, 6)).toThrow();
  });
});

describe("booking date and time rules", () => {
  const now = new Date("2026-07-09T17:30:00.000Z");

  it("uses Asia/Bangkok for the business date", () => {
    expect(getBangkokDateKey(now)).toBe("2026-07-10");
    expect(isBookableDate("2026-07-09", now)).toBe(false);
    expect(isBookableDate("2026-07-10", now)).toBe(true);
    expect(isBookableDate(addDaysToDateKey("2026-07-10", 365), now)).toBe(true);
    expect(isBookableDate(addDaysToDateKey("2026-07-10", 366), now)).toBe(false);
  });

  it("allows admins to block December 2027 without extending the customer booking horizon", () => {
    expect(isBookableDate("2027-12-01", now)).toBe(false);
    expect(isAdminCalendarDate("2027-12-01", now)).toBe(true);
    expect(isAdminCalendarDate("2026-07-09", now)).toBe(false);
    expect(isAdminCalendarDate("2100-12-31", now)).toBe(true);
    expect(isAdminCalendarDate("2101-01-01", now)).toBe(false);
  });

  it("accepts only configured time/package combinations", () => {
    expect(isSupportedTimeSlot("morning", 3, "07:00", "10:00")).toBe(true);
    expect(isSupportedTimeSlot("morning", 4, "07:00", "10:00")).toBe(false);
    expect(isSupportedTimeSlot("afternoon", 4, "14:00", "18:00")).toBe(true);
  });

  it("normalizes whitespace and rejects control characters", () => {
    const result = bookingInputSchema.safeParse({
      bookingDate: getBangkokDateKey(),
      period: "morning",
      startTime: "07:00",
      endTime: "10:00",
      hours: 3,
      graduates: 1,
      fullname: "  Test   Customer  ",
      phone: "081-234-5678",
      line: " line-id ",
      facebook: "",
      university: "University",
      faculty: "Faculty",
      note: "safe note",
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullname).toBe("Test Customer");

    expect(
      bookingInputSchema.safeParse({
        bookingDate: getBangkokDateKey(),
        period: "morning",
        startTime: "07:00",
        endTime: "10:00",
        hours: 3,
        graduates: 1,
        fullname: "Bad\u0000Name",
        phone: "0812345678",
        line: "",
        facebook: "",
        university: "University",
        faculty: "Faculty",
        note: "",
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      }).success
    ).toBe(false);
  });
});
