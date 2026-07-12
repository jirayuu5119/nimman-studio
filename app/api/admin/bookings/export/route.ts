import { NextRequest, NextResponse } from "next/server";
import {
  normalizeAdminBookingSearch,
  normalizeAdminBookingStatus,
} from "@/lib/admin-booking-filters";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/types/booking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 1000;

function displayTime(booking: Booking) {
  if (booking.start_time && booking.end_time) {
    return `${booking.start_time} - ${booking.end_time}`;
  }

  return booking.period === "morning" ? "รอบเช้า" : "รอบบ่าย";
}

export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const search = normalizeAdminBookingSearch(
    request.nextUrl.searchParams.get("q")
  );
  const status = normalizeAdminBookingStatus(
    request.nextUrl.searchParams.get("status")
  );
  const supabase = createAdminClient();
  const bookings: Booking[] = [];

  for (let offset = 0; ; offset += BATCH_SIZE) {
    let query = supabase
      .from("bookings")
      .select(
        "id,booking_no,fullname,phone,booking_date,period,start_time,end_time,total_price,deposit_amount,remaining_amount,status,slip_path,slip_url"
      );

    if (search) {
      query = query.or(
        `booking_no.ilike.%${search}%,fullname.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      return NextResponse.json(
        { error: "Export failed" },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const batch = (data ?? []) as Booking[];
    bookings.push(...batch);
    if (batch.length < BATCH_SIZE) break;
  }

  const csv = createCsv(
    [
      "เลขจอง",
      "ลูกค้า",
      "เบอร์โทร",
      "วันที่",
      "เวลา",
      "ราคาเต็ม",
      "มัดจำ",
      "ยอดคงเหลือ",
      "สถานะ",
      "มีสลิป",
    ],
    bookings.map((booking) => [
      booking.booking_no,
      booking.fullname,
      booking.phone,
      booking.booking_date,
      displayTime(booking),
      booking.total_price ?? 0,
      booking.deposit_amount ?? 0,
      booking.remaining_amount ?? 0,
      booking.status,
      booking.slip_path || booking.slip_url ? "มี" : "ไม่มี",
    ])
  );

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="bookings.csv"',
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
