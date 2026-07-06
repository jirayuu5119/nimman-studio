import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  if (!process.env.DISCORD_WEBHOOK_URL) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing DISCORD_WEBHOOK_URL",
      },
      { status: 500 }
    );
  }

  const message = `
## 📸 มี Booking ใหม่

**Booking**
${body.bookingNo}

👤 ${body.fullname}
📞 ${body.phone}
💬 LINE : ${body.line || "-"}

📅 ${body.bookingDate}
🕘 ${body.startTime} - ${body.endTime}

🎓 ${body.graduates} คน

🏫 ${body.university || "-"}
🎓 ${body.faculty || "-"}

💰 ${Number(body.totalPrice).toLocaleString()} บาท
`;

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          success: false,
          error: "Discord Webhook Error",
          status: response.status,
          detail: errorText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("Discord Notify Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}