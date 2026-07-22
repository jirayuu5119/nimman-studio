import { describe, expect, it } from "vitest";
import {
  INITIAL_RESET_CALENDAR_DAY_STATE,
  buildAdminPeriodMap,
  getAdminDayStatus,
  getResetCalendarDayConfirmation,
  hasAdminBlockedSlots,
} from "@/lib/admin-calendar";

describe("admin calendar view model", () => {
  it("keeps the existing day availability states", () => {
    expect(getAdminDayStatus(false, false)).toEqual({ label: "ว่าง", tone: "open" });
    expect(getAdminDayStatus(true, false)).toEqual({
      label: "เช้าไม่ว่าง",
      tone: "partial",
    });
    expect(getAdminDayStatus(false, true)).toEqual({
      label: "บ่ายไม่ว่าง",
      tone: "partial",
    });
    expect(getAdminDayStatus(true, true)).toEqual({ label: "เต็ม", tone: "full" });
  });

  it("merges occupied periods by booking date", () => {
    expect(
      buildAdminPeriodMap([
        { booking_date: "2026-07-20", period: "morning" },
        { booking_date: "2026-07-20", period: "afternoon" },
        { booking_date: "2026-07-21", period: "morning" },
      ])
    ).toEqual({
      "2026-07-20": { morning: true, afternoon: true },
      "2026-07-21": { morning: true, afternoon: false },
    });
  });

  it("shows reset only for days containing administrator blocks", () => {
    expect(hasAdminBlockedSlots([])).toBe(false);
    expect(hasAdminBlockedSlots([{ id: "blocked-1" }])).toBe(true);
  });

  it("provides stable initial state and date-specific confirmation copy", () => {
    expect(INITIAL_RESET_CALENDAR_DAY_STATE).toEqual({
      status: "idle",
      message: "",
    });
    expect(getResetCalendarDayConfirmation("1 ธันวาคม 2570")).toBe(
      "ยืนยันเปิดคิวทั้งวันสำหรับ 1 ธันวาคม 2570? คิวลูกค้าที่จองแล้วจะยังคงอยู่"
    );
  });
});
