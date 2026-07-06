import { supabase } from "./supabase";
import type { BookingData } from "@/types/booking";

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function createBooking(
  bookingNo: string,
  booking: BookingData
) {
  if (!booking.date || !booking.period) {
    throw new Error("กรุณาเลือกวันที่และรอบเวลา");
  }

  if (!booking.startTime || !booking.endTime) {
    throw new Error("กรุณาเลือกช่วงเวลาถ่าย");
  }

  if (!booking.fullname || !booking.phone) {
    throw new Error("กรุณากรอกชื่อและเบอร์โทร");
  }

  if (!booking.slipUrl) {
    throw new Error("กรุณาอัปโหลดสลิปมัดจำ");
  }

  const bookingDate = formatDateLocal(booking.date);

  const totalPrice = booking.totalPrice;
  const depositAmount = 1000;
  const remainingAmount = Math.max(totalPrice - depositAmount, 0);

  const { data: existingBooking, error: checkError } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_date", bookingDate)
    .eq("period", booking.period)
    .eq("start_time", booking.startTime)
    .eq("end_time", booking.endTime)
    .in("status", ["pending", "paid", "confirmed"])
    .maybeSingle();

  if (checkError) {
    console.error("Check booking error:", checkError);
    throw new Error("ตรวจสอบช่วงเวลาจองไม่สำเร็จ");
  }

  if (existingBooking) {
    throw new Error("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น");
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      booking_no: bookingNo,

      booking_date: bookingDate,
      period: booking.period,
      start_time: booking.startTime,
      end_time: booking.endTime,

      hours: booking.hours,
      graduates: booking.graduates,

      fullname: booking.fullname,
      phone: booking.phone,
      line: booking.line || null,
      facebook: booking.facebook || null,

      university: booking.university || null,
      faculty: booking.faculty || null,
      note: booking.note || null,

      total_price: totalPrice,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,

      slip_url: booking.slipUrl,

      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Create booking error:", error);
    throw new Error("บันทึกข้อมูลการจองไม่สำเร็จ");
  }

  try {
    await fetch("/api/notify/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingNo,
        fullname: booking.fullname,
        phone: booking.phone,
        line: booking.line,
        bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        graduates: booking.graduates,
        totalPrice,
        depositAmount,
        remainingAmount,
        university: booking.university,
        faculty: booking.faculty,
      }),
    });
  } catch (err) {
    console.error("Notify Error:", err);
  }

  return data;
}