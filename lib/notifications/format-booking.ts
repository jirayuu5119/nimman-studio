export type DiscordBooking = {
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
      .replace(/[\\`*_~|>]/g, "\\$&")
      .trim()
      .slice(0, max) || "-"
  );
}

export function buildBookingCreatedMessage(booking: DiscordBooking) {
  return [
    "## 📸 มี Booking ใหม่",
    "",
    `**Booking** ${safe(booking.booking_no, 40)}`,
    `👤 ${safe(booking.fullname)}`,
    `📞 ${safe(booking.phone, 30)}`,
    `💬 LINE : ${safe(booking.line)}`,
    `📅 ${safe(booking.booking_date, 20)}`,
    `🕘 ${safe(booking.start_time, 10)} - ${safe(booking.end_time, 10)}`,
    `🎓 ${safe(booking.graduates, 10)} คน`,
    `🏫 ${safe(booking.university)}`,
    `🎓 ${safe(booking.faculty)}`,
    `💰 ${Number(booking.total_price).toLocaleString("th-TH")} บาท`,
  ]
    .join("\n")
    .slice(0, 1900);
}
