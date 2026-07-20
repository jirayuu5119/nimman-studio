export type BookingNotification = {
  booking_no: string;
  fullname: string;
  phone: string;
  line: string | null;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  graduates: number;
  university: string | null;
  faculty: string | null;
  total_price: number;
};

function safe(value: unknown, max = 200) {
  return (
    String(value ?? "-")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, max) || "-"
  );
}

export function buildBookingCreatedMessage(booking: BookingNotification) {
  return [
    "📸 มี Booking ใหม่",
    "",
    `Booking: ${safe(booking.booking_no, 40)}`,
    `ลูกค้า: ${safe(booking.fullname)}`,
    `โทร: ${safe(booking.phone, 30)}`,
    `LINE: ${safe(booking.line)}`,
    `วันที่: ${safe(booking.booking_date, 20)}`,
    `เวลา: ${safe(booking.start_time, 10)} - ${safe(booking.end_time, 10)}`,
    `บัณฑิต: ${safe(booking.graduates, 10)} คน`,
    `มหาวิทยาลัย: ${safe(booking.university)}`,
    `คณะ: ${safe(booking.faculty)}`,
    `ยอดรวม: ${Number(booking.total_price).toLocaleString("th-TH")} บาท`,
  ]
    .join("\n")
    .slice(0, 4000);
}
