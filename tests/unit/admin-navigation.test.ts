import { describe, expect, it } from "vitest";
import {
  ADMIN_NAVIGATION,
  ADMIN_SECTION_IDS,
  isAdminNavigationActive,
} from "@/lib/admin-navigation";

describe("admin navigation", () => {
  it("exposes only existing admin routes and page sections", () => {
    expect(ADMIN_NAVIGATION.map(({ label, href }) => ({ label, href }))).toEqual([
      { label: "แดชบอร์ด", href: "/admin" },
      { label: "ปฏิทินคิว", href: "/admin/calendar" },
      { label: "ช่องทางติดต่อ", href: "/admin#portfolio" },
      { label: "การรับชำระเงิน", href: "/admin#payments" },
      { label: "ความปลอดภัย", href: "/admin#security" },
      { label: "รายการจอง", href: "/admin#bookings" },
    ]);
    expect(ADMIN_SECTION_IDS).toEqual({
      portfolio: "portfolio",
      payments: "payments",
      security: "security",
      bookings: "bookings",
    });
  });

  it("marks routes and matching page anchors active", () => {
    expect(isAdminNavigationActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavigationActive("/admin/calendar", "/admin/calendar")).toBe(true);
    expect(isAdminNavigationActive("/admin/calendar", "/admin")).toBe(false);
    expect(isAdminNavigationActive("/admin", "/admin#payments")).toBe(false);
    expect(
      isAdminNavigationActive("/admin", "/admin#payments", "#payments")
    ).toBe(true);
  });
});
