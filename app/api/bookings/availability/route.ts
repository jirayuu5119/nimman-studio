import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

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
    const response = await fetch(
      process.env.DISCORD_WEBHOOK_URL!,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Discord Webhook Error");
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}