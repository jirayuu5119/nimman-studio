import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

describe.skipIf(!hasSupabaseConfig)("production RLS boundaries", () => {
  it("does not expose bookings to the anonymous key", async () => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error } = await client.from("bookings").select("id").limit(1);
    expect(error).toBeTruthy();
  });
});
