import { NextResponse } from "next/server";
import type { BookingPeriod } from "@/types/booking";
import { generateBookingNo } from "@/lib/booking";
import { createBookingAccessToken } from "@/lib/bookingAccessToken";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ACTIVE_BOOKING_STATUSES = ["pending", "paid", "confirmed", "completed"];
const DEPOSIT_AMOUNT = 1000;

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing ${key}`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function getRequiredNumber(formData: FormData, key: string) {
  const value = Number(getRequiredString(formData, key));

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

async function notifyDiscord(payload: {
  bookingNo: string;
  fullname: string;
  phone: string;
  line: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  graduates: number;
  university: string | null;
  faculty: string | null;
  totalPrice: number;
}) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return;
  }

  const message = `
## 📸 มี Booking ใหม่

**Booking**
${payload.bookingNo}

👤 ${payload.fullname}
📞 ${payload.phone}
💬 LINE : ${payload.line || "-"}

📅 ${payload.bookingDate}
🕘 ${payload.startTime} - ${payload.endTime}

🎓 ${payload.graduates} คน

🏫 ${payload.university || "-"}
🎓 ${payload.faculty || "-"}

💰 ${payload.totalPrice.toLocaleString()} บาท
`;

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });
  } catch (error) {
    console.error("Discord Notify Error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const slip = formData.get("slip");

    if (!(slip instanceof File)) {
      return NextResponse.json(
        { error: "กรุณาอัปโหลดสลิป" },
        { status: 400 }
      );
    }

    if (!slip.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "กรุณาเลือกไฟล์รูปภาพ" },
        { status: 400 }
      );
    }

    const bookingDate = getRequiredString(formData, "bookingDate");
    const period = getRequiredString(formData, "period") as BookingPeriod;
    const startTime = getRequiredString(formData, "startTime");
    const endTime = getRequiredString(formData, "endTime");
    const hours = getRequiredNumber(formData, "hours");
    const graduates = getRequiredNumber(formData, "graduates");
    const fullname = getRequiredString(formData, "fullname");
    const phone = getRequiredString(formData, "phone");
    const line = getOptionalString(formData, "line");
    const facebook = getOptionalString(formData, "facebook");
    const university = getOptionalString(formData, "university");
    const faculty = getOptionalString(formData, "faculty");
    const note = getOptionalString(formData, "note");
    const totalPrice = getRequiredNumber(formData, "totalPrice");
    const depositAmount = DEPOSIT_AMOUNT;
    const remainingAmount = Math.max(totalPrice - depositAmount, 0);

    if (period !== "morning" && period !== "afternoon") {
      return NextResponse.json(
        { error: "รอบเวลาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const [existingBookingResult, blockedSlotResult] = await Promise.all([
      supabaseServer
        .from("bookings")
        .select("id")
        .eq("booking_date", bookingDate)
        .eq("period", period)
        .in("status", ACTIVE_BOOKING_STATUSES)
        .maybeSingle(),
      supabaseServer
        .from("blocked_slots")
        .select("id")
        .eq("booking_date", bookingDate)
        .eq("period", period)
        .maybeSingle(),
    ]);

    if (existingBookingResult.error) {
      throw existingBookingResult.error;
    }

    if (blockedSlotResult.error) {
      throw blockedSlotResult.error;
    }

    if (existingBookingResult.data || blockedSlotResult.data) {
      return NextResponse.json(
        { error: "รอบเวลานี้ถูกจองหรือถูกปิดแล้ว กรุณาเลือกรอบอื่น" },
        { status: 409 }
      );
    }

    const bookingNo = generateBookingNo();
    const ext = slip.name.split(".").pop() || "jpg";
    const filePath = `${bookingNo}-${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(await slip.arrayBuffer());

    const uploadResult = await supabaseServer.storage
      .from("slips")
      .upload(filePath, fileBuffer, {
        contentType: slip.type,
        upsert: false,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const { data: publicSlip } = supabaseServer.storage
      .from("slips")
      .getPublicUrl(filePath);

    const slipUrl = publicSlip.publicUrl;

    const { data, error } = await supabaseServer
      .from("bookings")
      .insert({
        booking_no: bookingNo,
        booking_date: bookingDate,
        period,
        start_time: startTime,
        end_time: endTime,
        hours,
        graduates,
        fullname,
        phone,
        line,
        facebook,
        university,
        faculty,
        note,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        slip_url: slipUrl,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await notifyDiscord({
      bookingNo,
      fullname,
      phone,
      line,
      bookingDate,
      startTime,
      endTime,
      graduates,
      university,
      faculty,
      totalPrice,
    });

    return NextResponse.json({
      booking: data,
      bookingNo,
      accessToken: createBookingAccessToken(bookingNo),
      slipUrl,
      depositAmount,
      remainingAmount,
    });
  } catch (error) {
    console.error("Create booking API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "บันทึกการจองไม่สำเร็จ กรุณาลองใหม่",
      },
      { status: 500 }
    );
  }
}
