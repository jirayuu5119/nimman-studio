import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { AvailabilitySlot } from "@/types/booking";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const [bookingsResult, blockedSlotsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("booking_date, period, status")
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("blocked_slots")
      .select("booking_date, period, reason"),
  ]);

  if (bookingsResult.error || blockedSlotsResult.error) {
    const error = bookingsResult.error ?? blockedSlotsResult.error;

    console.error("Availability Error:", error);

    return NextResponse.json(
      {
        error: error?.message ?? "Availability query failed",
      },
      {
        status: 500,
      }
    );
  }

  const bookings = (bookingsResult.data ?? []).map((slot) => ({
    ...slot,
    source: "booking" as const,
  }));

  const blockedSlots = (blockedSlotsResult.data ?? []).map((slot) => ({
    booking_date: slot.booking_date,
    period: slot.period,
    status: "blocked" as const,
    source: "blocked" as const,
    reason: slot.reason,
  }));

  return NextResponse.json([
    ...bookings,
    ...blockedSlots,
  ] satisfies AvailabilitySlot[]);
}
