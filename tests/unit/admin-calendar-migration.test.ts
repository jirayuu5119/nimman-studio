import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../../supabase/migrations/20260722142022_allow_admin_calendar_dates_through_2100.sql",
  import.meta.url
);

describe("admin calendar migration", () => {
  const sql = readFileSync(migrationUrl, "utf8");

  it("aligns all admin calendar RPCs with the 2100 limit", () => {
    expect(sql).toContain("block_booking_slot_atomic");
    expect(sql).toContain("block_booking_day_atomic");
    expect(sql).toContain("reset_booking_day_atomic");
    expect(sql.match(/date '2100-12-31'/g)).toHaveLength(3);
    expect(sql).not.toContain("date + 365");
  });

  it("resets only blocked slots and keeps the RPC private", () => {
    expect(sql).toMatch(/delete\s+from public\.blocked_slots/i);
    expect(sql).not.toMatch(/delete\s+from public\.bookings/i);
    expect(sql).toContain("'reset_booking_day'");
    expect(sql).toContain(
      "revoke all on function public.reset_booking_day_atomic(date, uuid) from anon, authenticated"
    );
    expect(sql).toContain(
      "grant execute on function public.reset_booking_day_atomic(date, uuid) to service_role"
    );
  });
});

