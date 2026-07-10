import { NextResponse } from "next/server";
import { verifyBookingAccessToken } from "@/lib/bookingAccessToken";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BOOKING_FIELDS = [
  "booking_no",
  "booking_date",
  "start_time",
  "end_time",
  "hours",
  "graduates",
  "fullname",
  "phone",
  "university",
  "faculty",
  "total_price",
  "status",
  "created_at",
  "updated_at",
].join(",");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingNo = searchParams.get("bookingNo")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";

  if (
    !/^NF-\d{8}-\d{4}$/.test(bookingNo) ||
    !verifyBookingAccessToken(bookingNo, token)
  ) {
    return NextResponse.json(
      { error: "ลิงก์ตรวจสอบการจองไม่ถูกต้อง" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseServer
    .from("bookings")
    .select(BOOKING_FIELDS)
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (error) {
    console.error("Booking status query error:", error);
    return NextResponse.json(
      { error: "ตรวจสอบสถานะการจองไม่สำเร็จ" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "ไม่พบรายการจองนี้" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { booking: data },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
