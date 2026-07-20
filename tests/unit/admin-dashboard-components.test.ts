import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminStatusBanner } from "@/components/admin/AdminStatusBanner";

describe("admin dashboard components", () => {
  it("renders the compact dashboard heading and real public booking link", () => {
    const html = renderToStaticMarkup(createElement(AdminHeader));
    expect(html).toContain("แดชบอร์ดผู้ดูแล");
    expect(html).toContain('href="/booking"');
    expect(html).toContain("ดูหน้าเว็บจอง");
  });

  it("renders health and retention values supplied by the server", () => {
    const healthy = renderToStaticMarkup(
      createElement(AdminStatusBanner, {
        failedNotifications: 0,
        retentionDays: 365,
      })
    );
    expect(healthy).toContain("ระบบแจ้งเตือนพร้อมทำงาน");
    expect(healthy).toContain("Retention: 365 วัน");

    const warning = renderToStaticMarkup(
      createElement(AdminStatusBanner, {
        failedNotifications: 3,
        retentionDays: null,
      })
    );
    expect(warning).toContain("ส่งไม่สำเร็จ 3 รายการ");
    expect(warning).toContain("ยังไม่เปิดใช้งาน");
  });

  it("offers only existing quick actions", () => {
    const html = renderToStaticMarkup(createElement(AdminQuickActions));
    expect(html).toContain('href="/booking"');
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/calendar"');
    expect(html).toContain('href="/api/admin/bookings/export"');
    expect(html).not.toContain("Backup");
    expect(html).not.toContain("Import");
  });
});
