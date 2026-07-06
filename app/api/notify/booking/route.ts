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
💰 ${Number(body.totalPrice).toLocaleString()} บาท

🏫 ${body.university || "-"}
🎓 ${body.faculty || "-"}
`;

  if (
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.TELEGRAM_CHAT_ID
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
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

    const result = await response.json();

    console.log("Telegram Response:", result);

    if (!response.ok || !result.ok) {
      return NextResponse.json(
        {
          success: false,
          telegram: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      telegram: result,
    });
  } catch (err) {
    console.error("Telegram Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}