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

  const bookingDate = formatDateLocal(booking.date);

  const { data: existingBooking, error: checkError } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_date", bookingDate)
    .eq("period", booking.period)
    .in("status", ["pending", "confirmed"])
    .maybeSingle();

  if (checkError) {
    console.error(checkError);
    throw checkError;
  }

  if (existingBooking) {
    throw new Error("รอบเวลานี้ถูกจองแล้ว กรุณาเลือกวันหรือช่วงเวลาอื่น");
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      booking_no: bookingNo,
      booking_date: bookingDate,
      period: booking.period,
      hours: booking.hours,
      graduates: booking.graduates,
      fullname: booking.fullname,
      phone: booking.phone,
      line: booking.line,
      facebook: booking.facebook,
      university: booking.university,
      faculty: booking.faculty,
      note: booking.note,
      total_price: booking.totalPrice,
      slip_url: booking.slipUrl,
      status: booking.status,
    })
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}