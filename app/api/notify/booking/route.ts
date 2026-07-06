import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const message = `
📸 มี Booking ใหม่

Booking : ${body.bookingNo}

👤 ${body.fullname}
📞 ${body.phone}
LINE : ${body.line || "-"}

📅 ${body.bookingDate}
🕘 ${body.startTime} - ${body.endTime}

🎓 ${body.graduates} คน
💰 ${body.totalPrice?.toLocaleString()} บาท

🏫 ${body.university || "-"}
🎓 ${body.faculty || "-"}
`;

  if (
    process.env.TELEGRAM_BOT_TOKEN &&
    process.env.TELEGRAM_CHAT_ID
  ) {
    try {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
          }),
        }
      );

      console.log("Telegram Notification Sent");
    } catch (err) {
      console.error("Telegram Notification Error", err);
    }
  }

  return NextResponse.json({
    success: true,
  });
}