import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { addDaysToDateKey, getBangkokDateKey } from "@/lib/booking-rules";

const runIntegration = process.env.RUN_SUPABASE_INTEGRATION === "1";

describe.skipIf(!runIntegration)("production RLS boundaries", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  it("connects to a real Supabase Auth service", async () => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey! },
    });
    expect(response.ok).toBe(true);
  });

  it("does not expose bookings to the anonymous key", async () => {
    const client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client.from("bookings").select("id").limit(1);
    expect(error?.code).toBe("42501");
    expect(error?.message.toLowerCase()).toContain("permission denied");
  });

  it("does not expose admin or operational tables to the anonymous key", async () => {
    const client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const table of ["admin_users", "audit_logs", "notification_outbox"]) {
      const { error } = await client.from(table).select("*").limit(1);
      expect(error?.code).toBe("42501");
    }
  });

  it("does not expose privileged RPC functions to the anonymous key", async () => {
    const client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client.rpc("get_booking_dashboard_analytics");
    expect(error?.code).toBe("42501");
  });

  it("allows the server role to use required tables and analytics", async () => {
    expect(serviceRoleKey).toBeTruthy();
    const client = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const bookings = await client.from("bookings").select("id").limit(1);
    expect(bookings.error).toBeNull();

    const analytics = await client.rpc("get_booking_dashboard_analytics");
    expect(analytics.error).toBeNull();
    expect(analytics.data).toMatchObject({ chartData: expect.any(Array) });
  });

  it("does not allow the legacy booking RPC to bypass privacy acknowledgement", async () => {
    const client = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bypassPhone = "0899999999";
    const result = await client.rpc("create_booking_atomic", {
      p_booking_date: addDaysToDateKey(getBangkokDateKey(), 300),
      p_period: "morning",
      p_start_time: "07:00",
      p_end_time: "10:00",
      p_hours: 3,
      p_graduates: 1,
      p_fullname: "Privacy bypass probe",
      p_phone: bypassPhone,
      p_line: "",
      p_facebook: "",
      p_university: "",
      p_faculty: "",
      p_note: "",
      p_total_price: 4000,
      p_deposit_amount: 1000,
      p_remaining_amount: 3000,
      p_slip_path: "2099/01/00000000-0000-4000-8000-000000000000.png",
    });
    expect(result.error).not.toBeNull();

    const inserted = await client
      .from("bookings")
      .select("id")
      .eq("phone", bypassPhone);
    expect(inserted.error).toBeNull();
    expect(inserted.data).toEqual([]);
  });
});
