import { NextResponse } from "next/server";
import {
  addDaysToDateKey,
  BOOKING_HORIZON_DAYS,
  getBangkokDateKey,
} from "@/lib/booking-rules";
import { OCCUPYING_BOOKING_STATUSES } from "@/lib/booking-status";
import { getRequestId, logServerError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AvailabilitySlot } from "@/types/booking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const supabase = createAdminClient();
    const today = getBangkokDateKey();
    const horizon = addDaysToDateKey(today, BOOKING_HORIZON_DAYS);
    const [bookingsResult, blockedSlotsResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_date, period, status")
        .in("status", [...OCCUPYING_BOOKING_STATUSES])
        .gte("booking_date", today)
        .lte("booking_date", horizon),
      supabase
        .from("blocked_slots")
        .select("booking_date, period, reason")
        .gte("booking_date", today)
        .lte("booking_date", horizon),
    ]);

    if (bookingsResult.error || blockedSlotsResult.error) {
      throw new Error("AVAILABILITY_QUERY_FAILED");
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

    return NextResponse.json(
      [...bookings, ...blockedSlots] satisfies AvailabilitySlot[],
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logServerError(
      "booking_availability",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { error: "โหลดตารางคิวไม่สำเร็จ", requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
