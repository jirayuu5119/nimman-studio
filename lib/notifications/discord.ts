import "server-only";

import {
  buildBookingCreatedMessage,
  type DiscordBooking,
} from "@/lib/notifications/format-booking";

export async function sendBookingCreatedNotification(booking: DiscordBooking) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { ok: false as const, code: "WEBHOOK_NOT_CONFIGURED" };

  const message = buildBookingCreatedMessage(booking);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message,
        allowed_mentions: { parse: [] },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { ok: false as const, code: `DISCORD_HTTP_${response.status}` };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, code: "DISCORD_NETWORK_ERROR" };
  }
}
