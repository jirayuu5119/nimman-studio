import { supabase } from "./supabase";
import type { BookingData } from "@/types/booking";

export async function createBooking(
  bookingNo: string,
  booking: BookingData
) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      booking_no: bookingNo,
      booking_date: booking.date?.toISOString().split("T")[0],
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

  console.log(data);

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}