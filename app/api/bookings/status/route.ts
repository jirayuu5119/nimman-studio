import { NextRequest, NextResponse } from "next/server";
import {
  BOOKING_ACCESS_COOKIE,
  createBookingAccessSession,
  getBookingIdFromAccessSession,
  setBookingAccessCookie,
} from "@/lib/booking-access-session";
import { verifyBookingAccessToken } from "@/lib/bookingAccessToken";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestId, logServerError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BOOKING_FIELDS =
  "id,booking_no,booking_date,start_time,end_time,hours,graduates,fullname,phone,university,faculty,total_price,status,created_at,updated_at";

type StatusBooking = {
  id: string;
  booking_no: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  hours: number;
  graduates: number;
  fullname: string;
  phone: string;
  university: string | null;
  faculty: string | null;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
};

function legacyTokensEnabled() {
  const cutoff = process.env.LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL;
  if (!cutoff) return false;
  const timestamp = Date.parse(cutoff);
  return Number.isFinite(timestamp) && Date.now() < timestamp;
}

function denied() {
  return NextResponse.json(
    { error: "กรุณาตรวจสอบเลขที่การจองและเบอร์โทรศัพท์อีกครั้ง" },
    { status: 403, headers: { "Cache-Control": "private, no-store" } }
  );
}

async function getStatus(request: NextRequest) {
  const rateLimit = await consumeRateLimit(request, "booking-status", 60, 600);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "เรียกดูสถานะบ่อยเกินไป กรุณารอสักครู่" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "private, no-store",
        },
      }
    );
  }

  const bookingNo = request.nextUrl.searchParams.get("bookingNo")?.trim() ?? "";
  if (!/^NF-\d{8}-\d{4}$/.test(bookingNo)) return denied();

  const supabase = createAdminClient();
  const cookieToken = request.cookies.get(BOOKING_ACCESS_COOKIE)?.value;
  const sessionBookingId = await getBookingIdFromAccessSession(cookieToken);
  let booking: StatusBooking | null = null;
  let replacementSession: Awaited<
    ReturnType<typeof createBookingAccessSession>
  > | null = null;

  // Read the booking only after the opaque session has identified its booking.
  // The legacy branch remains temporary and is disabled without an explicit cutoff.
  if (sessionBookingId) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_FIELDS)
      .eq("id", sessionBookingId)
      .maybeSingle();

    if (error) return denied();
    if (data?.booking_no === bookingNo) booking = data as StatusBooking;
  }

  if (!booking && legacyTokensEnabled()) {
    const legacyToken = request.nextUrl.searchParams.get("token")?.trim() ?? "";
    if (verifyBookingAccessToken(bookingNo, legacyToken)) {
      const { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_FIELDS)
        .eq("booking_no", bookingNo)
        .maybeSingle();

      if (!error && data) {
        booking = data as StatusBooking;
        replacementSession = await createBookingAccessSession(booking.id);
      }
    }
  }

  if (!booking) return denied();

  const publicBooking = {
    booking_no: booking.booking_no,
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    hours: booking.hours,
    graduates: booking.graduates,
    fullname: booking.fullname,
    phone: booking.phone,
    university: booking.university,
    faculty: booking.faculty,
    total_price: booking.total_price,
    status: booking.status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  };

  const response = NextResponse.json(
    { booking: publicBooking, legacyTokenExchanged: Boolean(replacementSession) },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
  if (replacementSession) setBookingAccessCookie(response, replacementSession);
  return response;
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    return await getStatus(request);
  } catch (error) {
    logServerError(
      "booking_status",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { error: "ตรวจสอบสถานะการจองไม่สำเร็จ", requestId },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
