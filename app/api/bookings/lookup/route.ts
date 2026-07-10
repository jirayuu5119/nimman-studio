import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createBookingAccessToken } from "@/lib/bookingAccessToken";
import {
  isValidLegacyLookupPhone,
  normalizePhone,
} from "@/lib/phone";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const globalRateLimit = globalThis as typeof globalThis & {
  bookingLookupAttempts?: Map<string, RateLimitEntry>;
};
const bookingLookupAttempts =
  globalRateLimit.bookingLookupAttempts ?? new Map<string, RateLimitEntry>();
globalRateLimit.bookingLookupAttempts = bookingLookupAttempts;

function hashPhone(value: string) {
  return createHash("sha256").update(value).digest();
}

function getClientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function consumeLookupAttempt(clientKey: string) {
  const now = Date.now();
  const current = bookingLookupAttempts.get(clientKey);

  if (!current || current.resetAt <= now) {
    bookingLookupAttempts.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export async function POST(request: Request) {
  const rateLimit = consumeLookupAttempt(getClientKey(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "ลองตรวจสอบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
        },
      }
    );
  }

  let payload: { bookingNo?: unknown; phone?: unknown };

  try {
    payload = (await request.json()) as {
      bookingNo?: unknown;
      phone?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: "ข้อมูลการจองไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "ข้อมูลการจองไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseServer
    .from("bookings")
    .select("booking_no,phone")
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (error) {
    console.error("Booking lookup query error:", error);
    return NextResponse.json(
      { error: "ตรวจสอบสถานะการจองไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500 }
    );
  }

  const expectedPhone = hashPhone(
    data?.phone ? normalizePhone(data.phone) : "0000000000"
  );
  const receivedPhone = hashPhone(phone);
  const phoneMatches = timingSafeEqual(expectedPhone, receivedPhone);

  if (!data || !phoneMatches) {
    return NextResponse.json(
      { error: "ข้อมูลการจองไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      bookingNo: data.booking_no,
      accessToken: createBookingAccessToken(data.booking_no),
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
