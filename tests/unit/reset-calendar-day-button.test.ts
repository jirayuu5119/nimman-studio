import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/actions", () => ({
  resetCalendarDay: async () => ({ status: "success", message: "" }),
}));

import { ResetCalendarDayButton } from "@/components/admin/ResetCalendarDayButton";

describe("ResetCalendarDayButton", () => {
  it("renders a semantic per-day reset form", () => {
    const html = renderToStaticMarkup(
      createElement(ResetCalendarDayButton, {
        dateKey: "2027-12-01",
        dateLabel: "1 ธันวาคม 2570",
      })
    );

    expect(html).toContain("เปิดคิวทั้งวัน");
    expect(html).toContain('name="bookingDate"');
    expect(html).toContain('value="2027-12-01"');
    expect(html).toContain('aria-live="polite"');
  });
});

