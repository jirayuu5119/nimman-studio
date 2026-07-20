import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  sendTelegramMessage,
  type TelegramTransportDependencies,
} from "@/lib/notifications/telegram";

const environment = {
  TELEGRAM_BOT_TOKEN: "123456:test-token",
  TELEGRAM_CHAT_ID: "987654321",
};

function dependencies(
  fetchImpl: typeof fetch,
  signal = new AbortController().signal
): TelegramTransportDependencies {
  return { environment, fetchImpl, timeoutSignal: () => signal };
}

afterEach(() => vi.restoreAllMocks());

describe("Telegram transport", () => {
  it("posts bounded plain text and requires Telegram ok confirmation", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const result = await sendTelegramMessage("hello", dependencies(fetchMock));

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123456:test-token/sendMessage",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ chat_id: "987654321", text: "hello" }),
      })
    );
    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    ).not.toHaveProperty("parse_mode");
  });

  it("fails closed when either environment value is missing", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const result = await sendTelegramMessage("hello", {
      ...dependencies(fetchMock),
      environment: { TELEGRAM_BOT_TOKEN: "token" },
    });
    expect(result).toEqual({ ok: false, code: "TELEGRAM_NOT_CONFIGURED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps HTTP and invalid Telegram responses to sanitized codes", async () => {
    const http = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("private body", { status: 503 }));
    await expect(
      sendTelegramMessage("hello", dependencies(http))
    ).resolves.toEqual({
      ok: false,
      code: "TELEGRAM_HTTP_503",
    });

    const invalid = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "private body" }), {
        status: 200,
      })
    );
    await expect(
      sendTelegramMessage("hello", dependencies(invalid))
    ).resolves.toEqual({ ok: false, code: "TELEGRAM_INVALID_RESPONSE" });
  });

  it("distinguishes an aborted timeout from another network failure", async () => {
    const controller = new AbortController();
    controller.abort();
    const timeout = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(
      sendTelegramMessage("hello", dependencies(timeout, controller.signal))
    ).resolves.toEqual({ ok: false, code: "TELEGRAM_TIMEOUT" });

    const network = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("offline"));
    await expect(
      sendTelegramMessage("hello", dependencies(network))
    ).resolves.toEqual({ ok: false, code: "TELEGRAM_NETWORK_ERROR" });
  });
});
