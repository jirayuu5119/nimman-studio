import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

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
    expect(analytics.data).toMatchObject({ chartData: [] });
  });
});
