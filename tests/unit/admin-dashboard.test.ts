import { describe, expect, it } from "vitest";
import {
  getAdminStatusPresentation,
  getOperationalStatus,
  normalizeDashboardAnalytics,
} from "@/lib/admin-dashboard";

describe("admin dashboard view models", () => {
  it("maps booking statuses to readable Thai labels and semantic tones", () => {
    expect(getAdminStatusPresentation("pending")).toEqual({
      label: "รอตรวจสอบ",
      tone: "warning",
    });
    expect(getAdminStatusPresentation("confirmed")).toEqual({
      label: "ยืนยันแล้ว",
      tone: "success",
    });
    expect(getAdminStatusPresentation("cancelled")).toEqual({
      label: "ยกเลิก",
      tone: "danger",
    });
    expect(getAdminStatusPresentation("custom")).toEqual({
      label: "custom",
      tone: "neutral",
    });
  });

  it("derives operational health from the real failed notification count", () => {
    expect(getOperationalStatus(0)).toMatchObject({
      tone: "success",
      title: "ระบบแจ้งเตือนพร้อมทำงาน",
    });
    expect(getOperationalStatus(2)).toMatchObject({
      tone: "warning",
      title: "มีการแจ้งเตือนส่งไม่สำเร็จ 2 รายการ",
    });
  });

  it("normalizes analytics without inventing invalid values", () => {
    expect(
      normalizeDashboardAnalytics({
        totalRevenue: "12000",
        totalBookings: 4,
        pending: "bad",
        confirmed: 3,
        chartData: [
          { date: "2026-07-20", revenue: "4000" },
          { date: 123, revenue: 5000 },
        ],
      })
    ).toMatchObject({
      totalRevenue: 12000,
      totalBookings: 4,
      pending: 0,
      confirmed: 3,
      chartData: [{ date: "2026-07-20", revenue: 4000 }],
    });
  });
});
