import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actionsUrl = new URL("../../app/admin/actions.ts", import.meta.url);

describe("admin calendar action wiring", () => {
  const source = readFileSync(actionsUrl, "utf8");

  it("uses the admin date boundary for close and reset actions", () => {
    expect(source).toContain('import { isAdminCalendarDate } from "@/lib/booking-rules"');
    expect(source).toContain("if (!isAdminCalendarDate(value))");
    expect(source).toContain("if (!isAdminCalendarDate(bookingDate))");
  });

  it("calls the private reset RPC with the selected date and actor", () => {
    expect(source).toContain("export async function resetCalendarDay(");
    expect(source).toContain('supabase.rpc("reset_booking_day_atomic"');
    expect(source).toContain("p_booking_date: bookingDate");
    expect(source).toContain("p_actor_user_id: admin.userId");
    expect(source).toContain('revalidatePath("/admin/calendar")');
  });

  it("returns inline success and error messages", () => {
    expect(source).toContain("เปิดคิวทั้งวันเรียบร้อยแล้ว");
    expect(source).toContain("เปิดคิวไม่สำเร็จ กรุณาลองอีกครั้ง");
  });
});
