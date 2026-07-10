import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createBookingAccessSession,
  setBookingAccessCookie,
} from "@/lib/booking-access-session";
import {
  calculateBookingPrice,
  getBangkokDateKey,
} from "@/lib/booking-rules";
import { bookingInputFromFormData } from "@/lib/booking-schema";
import { processOutboxItem } from "@/lib/notifications/outbox";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestId, logServerError } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectValidSlipType } from "@/lib/slip-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SLIP_SIZE = 3_000_000;
function errorResponse(message: string, status: number, requestId: string) {
  return NextResponse.json(
    { error: message, requestId },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let uploadedPath: string | null = null;
  let bookingCreated = false;

  try {
    const rateLimit = await consumeRateLimit(request, "booking-create", 5, 600);
    if (!rateLimit.allowed) {
      const response = errorResponse(
        "ส่งรายการหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
        429,
        requestId
      );
      response.headers.set("Retry-After", String(rateLimit.retryAfter));
      return response;
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SLIP_SIZE + 1_000_000) {
      return errorResponse("รูปสลิปมีขนาดใหญ่เกินไป", 413, requestId);
    }

    const formData = await request.formData();
    const parsed = bookingInputFromFormData(formData);
    if (!parsed.success) {
      return errorResponse(
        "ข้อมูลการจองไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        400,
        requestId
      );
    }

    const slip = formData.get("slip");
    if (!(slip instanceof File) || slip.size === 0) {
      return errorResponse("กรุณาอัปโหลดสลิป", 400, requestId);
    }
    if (slip.size > MAX_SLIP_SIZE) {
      return errorResponse("รูปสลิปมีขนาดใหญ่เกินไป", 413, requestId);
    }

    const buffer = Buffer.from(await slip.arrayBuffer());
    const detected = await detectValidSlipType(buffer);
    if (!detected) {
      return errorResponse(
        "รองรับเฉพาะไฟล์ JPG, PNG, HEIC หรือ HEIF",
        400,
        requestId
      );
    }

    const input = parsed.data;
    const prices = calculateBookingPrice(input.hours, input.graduates);
    const [year, month] = getBangkokDateKey().split("-");
    uploadedPath = `${year}/${month}/${randomUUID()}.${detected.ext}`;
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from("slips")
      .upload(uploadedPath, buffer, {
        contentType: detected.mime,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error("SLIP_UPLOAD_FAILED");

    const { data, error } = await supabase.rpc("create_booking_atomic", {
      p_booking_date: input.bookingDate,
      p_period: input.period,
      p_start_time: input.startTime,
      p_end_time: input.endTime,
      p_hours: input.hours,
      p_graduates: input.graduates,
      p_fullname: input.fullname,
      p_phone: input.phone,
      p_line: input.line,
      p_facebook: input.facebook,
      p_university: input.university,
      p_faculty: input.faculty,
      p_note: input.note,
      p_total_price: prices.totalPrice,
      p_deposit_amount: prices.depositAmount,
      p_remaining_amount: prices.remainingAmount,
      p_slip_path: uploadedPath,
    });

    if (error) {
      if (
        error.message.includes("SLOT_UNAVAILABLE") ||
        error.code === "23505"
      ) {
        await supabase.storage.from("slips").remove([uploadedPath]);
        uploadedPath = null;
        return errorResponse(
          "รอบเวลานี้ถูกจองหรือถูกปิดแล้ว กรุณาเลือกรอบอื่น",
          409,
          requestId
        );
      }
      throw new Error("BOOKING_TRANSACTION_FAILED");
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.booking_id || !result?.booking_no || !result?.outbox_id) {
      throw new Error("BOOKING_TRANSACTION_INVALID_RESULT");
    }
    bookingCreated = true;

    let session: Awaited<
      ReturnType<typeof createBookingAccessSession>
    > | null = null;
    try {
      session = await createBookingAccessSession(result.booking_id);
    } catch {
      logServerError("booking_session", requestId, "SESSION_CREATE_FAILED");
    }

    try {
      await processOutboxItem({
        id: result.outbox_id,
        booking_id: result.booking_id,
        event_type: "booking_created",
        attempts: 0,
      });
    } catch (notificationError) {
      logServerError(
        "booking_notification",
        requestId,
        notificationError instanceof Error
          ? notificationError.message.slice(0, 100)
          : "NOTIFICATION_FAILED"
      );
    }

    const response = NextResponse.json(
      {
        bookingNo: result.booking_no,
        totalPrice: prices.totalPrice,
        depositAmount: prices.depositAmount,
        remainingAmount: prices.remainingAmount,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
    if (session) setBookingAccessCookie(response, session);
    return response;
  } catch (error) {
    if (uploadedPath && !bookingCreated) {
      const supabase = createAdminClient();
      await supabase.storage.from("slips").remove([uploadedPath]);
    }
    logServerError(
      "booking_create",
      requestId,
      error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN"
    );
    return errorResponse(
      "บันทึกการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      500,
      requestId
    );
  }
}
