import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

describe("AdminSidebar", () => {
  it("renders branded semantic navigation with an active destination", () => {
    const html = renderToStaticMarkup(
      createElement(AdminSidebar, {
        pathname: "/admin",
        hash: "",
        logoutControl: createElement("button", null, "ออกจากระบบ"),
      })
    );

    expect(html).toContain('aria-label="เมนูผู้ดูแลระบบ"');
    expect(html).toContain("NIMMAN");
    expect(html).toContain("FOTO");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("ปฏิทินคิว");
    expect(html).toContain("ออกจากระบบ");
  });

  it("marks a matching dashboard section active", () => {
    const html = renderToStaticMarkup(
      createElement(AdminSidebar, {
        pathname: "/admin",
        hash: "#payments",
        logoutControl: createElement("button", null, "ออกจากระบบ"),
      })
    );

    expect(html).toMatch(
      /<a[^>]*aria-current="page"[^>]*href="\/admin#payments"/
    );
  });
});
