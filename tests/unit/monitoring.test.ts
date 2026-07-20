import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notifications/telegram", () => ({
  sendTelegramMessage: vi.fn(),
}));

import { sendTelegramMessage } from "@/lib/notifications/telegram";
import {
  buildOperationalAlertMessage,
  reportOperationalError,
} from "@/lib/monitoring";

const sendMock = vi.mocked(sendTelegramMessage);

afterEach(() => {
  vi.restoreAllMocks();
  sendMock.mockReset();
});

describe("Telegram operational alerts", () => {
  it("formats a bounded alert using only sanitized operational fields", () => {
    const message = buildOperationalAlertMessage({
      event: "cron failed\nprivate",
      code: "DB/ERROR",
      requestId: "request id",
      durationMs: 12.7,
    });
    expect(message).toBe(
      "Nimman Foto operational alert\nevent: cron_failed_private\ncode: DB_ERROR\nrequest: request_id\nduration: 13ms"
    );
    expect(message.length).toBeLessThanOrEqual(4000);
  });

  it("logs the original event and sends it through Telegram", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendMock.mockResolvedValue({ ok: true });
    await reportOperationalError({ event: "cron_failed", code: "DB_ERROR" });
    expect(sendMock).toHaveBeenCalledWith(
      "Nimman Foto operational alert\nevent: cron_failed\ncode: DB_ERROR"
    );
  });

  it("logs one warning without recursively reporting delivery failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    sendMock.mockResolvedValue({ ok: false, code: "TELEGRAM_HTTP_503" });
    await reportOperationalError({ event: "cron_failed", code: "DB_ERROR" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("TELEGRAM_HTTP_503");
  });
});
