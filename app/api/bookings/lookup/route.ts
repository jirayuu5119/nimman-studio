import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createBookingAccessSession,
  setBookingAccessCookie,
} from "@/lib/booking-access-session";
import { isValidLegacyLookupPhone, normalizePhone } from "@/lib/phone";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestId, logServerError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function invalidLookup(status = 401) {
  return NextResponse.json(
    { error: "ข้อมูลการจองไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const rateLimit = await consumeRateLimit(request, "booking-lookup", 6, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "ลองตรวจสอบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let payload: { bookingNo?: unknown; phone?: unknown };
    try {
      payload = (await request.json()) as typeof payload;
    } catch {
      return invalidLookup(400);
    }

    const bookingNo =
      typeof payload.bookingNo === "string"
        ? payload.bookingNo.trim().toUpperCase()
        : "";
    const phone =
      typeof payload.phone === "string" ? normalizePhone(payload.phone) : "";

    if (
      !/^NF-\d{8}-\d{4}$/.test(bookingNo) ||
      !isValidLegacyLookupPhone(phone)
    ) {
      return invalidLookup(400);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id,booking_no,phone")
      .eq("booking_no", bookingNo)
      .maybeSingle();

    if (error) throw new Error("BOOKING_LOOKUP_QUERY_FAILED");

    const expected = hash(
      data?.phone ? normalizePhone(data.phone) : "invalid-booking-phone"
    );
    const received = hash(phone);
    if (!data || !timingSafeEqual(expected, received)) return invalidLookup();

    const session = await createBookingAccessSession(data.id);
    const response = NextResponse.json(
      { bookingNo: data.booking_no },
      { headers: { "Cache-Control": "no-store" } }
    );
    setBookingAccessCookie(response, session);
    return response;
  } catch (error) {
    logServerError(
      "booking_lookup",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return NextResponse.json(
      { error: "ตรวจสอบสถานะการจองไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
