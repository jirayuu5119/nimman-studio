import "server-only";

import {
  buildBookingCreatedMessage,
  type BookingNotification,
} from "@/lib/notifications/format-booking";
import { getTelegramConfig } from "@/lib/notifications/telegram-config";

export type TelegramDeliveryResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "TELEGRAM_NOT_CONFIGURED"
        | `TELEGRAM_HTTP_${number}`
        | "TELEGRAM_INVALID_RESPONSE"
        | "TELEGRAM_TIMEOUT"
        | "TELEGRAM_NETWORK_ERROR";
    };

export type TelegramTransportDependencies = {
  environment: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
  timeoutSignal: (milliseconds: number) => AbortSignal;
};

const defaultDependencies: TelegramTransportDependencies = {
  environment: process.env,
  fetchImpl: fetch,
  timeoutSignal: AbortSignal.timeout,
};

export async function sendTelegramMessage(
  message: string,
  dependencies: TelegramTransportDependencies = defaultDependencies
): Promise<TelegramDeliveryResult> {
  const config = getTelegramConfig(dependencies.environment);
  if (!config) return { ok: false, code: "TELEGRAM_NOT_CONFIGURED" };

  const signal = dependencies.timeoutSignal(8_000);
  try {
    const response = await dependencies.fetchImpl(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message.slice(0, 4000),
        }),
        cache: "no-store",
        signal,
      }
    );

    if (!response.ok) {
      return { ok: false, code: `TELEGRAM_HTTP_${response.status}` };
    }

    const body = (await response.json().catch(() => null)) as
      | { ok?: boolean }
      | null;
    return body?.ok === true
      ? { ok: true }
      : { ok: false, code: "TELEGRAM_INVALID_RESPONSE" };
  } catch {
    return signal.aborted
      ? { ok: false, code: "TELEGRAM_TIMEOUT" }
      : { ok: false, code: "TELEGRAM_NETWORK_ERROR" };
  }
}

export function sendBookingCreatedNotification(booking: BookingNotification) {
  return sendTelegramMessage(buildBookingCreatedMessage(booking));
}
