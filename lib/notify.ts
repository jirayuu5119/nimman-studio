import { Resend } from "resend";
import type { BookingData } from "@/types/booking";

const resend = new Resend(process.env.RESEND_API_KEY);

type NotifyBookingProps = {
  bookingNo: string;
  booking: BookingData;
};

export async function notifyNewBooking({
  bookingNo,
  booking,
}: NotifyBookingProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Missing RESEND_API_KEY");
    return;
  }

  await resend.emails.send({
    from: "Nimman Studio <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL!,
    subject: `มี Booking ใหม่: ${bookingNo}`,
    html: `
      <h2>มี Booking ใหม่</h2>
      <p><b>Booking No:</b> ${bookingNo}</p>
      <p><b>ชื่อ:</b> ${booking.fullname}</p>
      <p><b>เบอร์:</b> ${booking.phone}</p>
      <p><b>วันที่:</b> ${booking.date?.toLocaleDateString("th-TH")}</p>
      <p><b>รอบ:</b> ${booking.period === "morning" ? "รอบเช้า" : "รอบบ่าย"}</p>
      <p><b>เวลา:</b> ${booking.startTime} - ${booking.endTime}</p>
      <p><b>จำนวนชั่วโมง:</b> ${booking.hours}</p>
      <p><b>บัณฑิต:</b> ${booking.graduates} คน</p>
      <p><b>ยอดรวม:</b> ${booking.totalPrice.toLocaleString()} บาท</p>
    `,
  });
}