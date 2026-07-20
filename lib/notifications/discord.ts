import "server-only";

import {
  buildBookingCreatedMessage,
  type BookingNotification,
} from "@/lib/notifications/format-booking";
import { selectBookingNotificationWebhook } from "@/lib/notifications/discord-config";

export async function sendBookingCreatedNotification(booking: BookingNotification) {
  const webhookUrl = selectBookingNotificationWebhook(process.env);
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
