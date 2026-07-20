# Telegram-only Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Discord with Telegram for new-booking and operational-error notifications, then safely deliver the existing failed booking notification exactly once.

**Architecture:** Keep the existing Supabase transactional outbox and booking response semantics. Add one server-only Telegram transport shared by booking delivery and operational alerts, then add an operator-only compare-and-set replay command that can claim one failed outbox row without exposing an HTTP endpoint.

**Tech Stack:** Next.js 16.2.10, TypeScript 5, Node.js 24.x, Supabase JS 2.110.7, Vitest 4.1.10, `tsx` 4.23.1, Telegram Bot API `sendMessage`, Vercel Git deployments.

## Global Constraints

- Telegram is the only runtime notification provider; there is no Discord fallback or dual delivery.
- Both booking notifications and operational alerts use `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for the same private chat.
- Telegram messages are plain text, contain no `parse_mode`, and are limited to 4,000 characters, below Telegram's 4,096-character maximum.
- The transport timeout is exactly 8,000 ms and every request uses `cache: "no-store"`.
- Booking creation still returns HTTP 201 after the database commit even when delivery fails.
- Delivery failures persist only sanitized `TELEGRAM_*` codes; credentials, chat IDs, customer message bodies, full Bot API URLs, and Telegram response bodies are never logged.
- The current Supabase schema, RLS, service-role boundary, outbox retry/backoff, pricing, booking, payment, authentication, and retention behavior remain unchanged.
- Replay is operator-only, accepts exactly one `NF-YYYYMMDD-NNNN` booking number, and has no public or admin HTTP endpoint.
- Production deploys through the existing PR, GitHub Actions, and Vercel Git workflow; rollback target is deployment `dpl_6dD4FR1qEXqdKgdayWRmxJuQeybG` at commit `b2d7914038e5738e2dfa6280a6f64ce6fde95e75`.

---

## File map

- `lib/notifications/format-booking.ts`: channel-neutral booking shape and bounded plain-text formatter.
- `lib/notifications/telegram-config.ts`: pure server-environment validation for bot token and chat ID.
- `lib/notifications/telegram.ts`: server-only Bot API transport and booking sender.
- `lib/notifications/outbox.ts`: existing outbox state machine wired to Telegram with PII-free warning logs.
- `lib/monitoring.ts`: structured logging plus Telegram operational-alert formatting and delivery.
- `lib/notifications/replay.ts`: pure replay argument/status guards.
- `scripts/replay-booking-notification.ts`: operator-only Supabase compare-and-set claim and normal outbox processing.
- `tests/unit/telegram.test.ts`: transport behavior and secret-safe request contract.
- `tests/unit/monitoring.test.ts`: operational alert formatting, delivery, and non-recursive failure logging.
- `tests/unit/notification-replay.test.ts`: replay input and idempotency guards.
- `tests/unit/security-boundaries.test.ts`: booking formatter sanitization and Telegram length boundary.
- `tests/unit/production-controls.test.ts`: Telegram environment configuration contract.
- `.env.example`, `README.md`, `docs/security-hardening.md`, `docs/backup-runbook.md`, `app/privacy/page.tsx`: Telegram-only operator and privacy documentation.
- `lib/notifications/discord.ts`, `lib/notifications/discord-config.ts`: deleted after callers and tests move to Telegram.

### Task 1: Channel-neutral booking formatter and Telegram configuration

**Files:**
- Create: `lib/notifications/telegram-config.ts`
- Modify: `lib/notifications/format-booking.ts`
- Modify: `tests/unit/security-boundaries.test.ts`
- Modify: `tests/unit/production-controls.test.ts`

**Interfaces:**
- Consumes: booking fields already selected by `lib/notifications/outbox.ts`.
- Produces: `BookingNotification`, `buildBookingCreatedMessage(booking: BookingNotification): string`, `TelegramConfig`, and `getTelegramConfig(environment: Record<string, string | undefined>): TelegramConfig | null`.

- [ ] **Step 1: Write failing configuration and formatting tests**

Replace the Discord import in `tests/unit/production-controls.test.ts` with:

```ts
import { getTelegramConfig } from "@/lib/notifications/telegram-config";
```

Replace the `booking notification configuration` describe block with:

```ts
describe("Telegram notification configuration", () => {
  it("requires and trims both server-only values", () => {
    expect(
      getTelegramConfig({
        TELEGRAM_BOT_TOKEN: " 123456:test-token ",
        TELEGRAM_CHAT_ID: " -1001234567890 ",
      })
    ).toEqual({ botToken: "123456:test-token", chatId: "-1001234567890" });
    expect(getTelegramConfig({ TELEGRAM_BOT_TOKEN: "token" })).toBeNull();
    expect(getTelegramConfig({ TELEGRAM_CHAT_ID: "123" })).toBeNull();
    expect(getTelegramConfig({})).toBeNull();
  });
});
```

Change the booking formatter test in `tests/unit/security-boundaries.test.ts` to:

```ts
it("removes control characters and bounds Telegram plain text", () => {
  const message = buildBookingCreatedMessage({
    booking_no: "NF-20260710-0001",
    fullname: `Name\u0000${"x".repeat(5000)}`,
    phone: "0812345678",
    line: null,
    booking_date: "2026-07-10",
    start_time: "07:00",
    end_time: "10:00",
    graduates: 1,
    university: null,
    faculty: null,
    total_price: 4000,
  });
  expect(message).not.toContain("\u0000");
  expect(message).toContain("Booking: NF-20260710-0001");
  expect(message.length).toBeLessThanOrEqual(4000);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/production-controls.test.ts tests/unit/security-boundaries.test.ts
```

Expected: FAIL because `telegram-config.ts` does not exist and the old formatter does not satisfy the Telegram contract.

- [ ] **Step 3: Implement the minimal formatter and configuration**

Create `lib/notifications/telegram-config.ts`:

```ts
export type TelegramConfig = {
  botToken: string;
  chatId: string;
};

export function getTelegramConfig(
  environment: Record<string, string | undefined>
): TelegramConfig | null {
  const botToken = environment.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = environment.TELEGRAM_CHAT_ID?.trim();
  return botToken && chatId ? { botToken, chatId } : null;
}
```

Replace `lib/notifications/format-booking.ts` with:

```ts
export type BookingNotification = {
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
      .trim()
      .slice(0, max) || "-"
  );
}

export function buildBookingCreatedMessage(booking: BookingNotification) {
  return [
    "📸 มี Booking ใหม่",
    "",
    `Booking: ${safe(booking.booking_no, 40)}`,
    `ลูกค้า: ${safe(booking.fullname)}`,
    `โทร: ${safe(booking.phone, 30)}`,
    `LINE: ${safe(booking.line)}`,
    `วันที่: ${safe(booking.booking_date, 20)}`,
    `เวลา: ${safe(booking.start_time, 10)} - ${safe(booking.end_time, 10)}`,
    `บัณฑิต: ${safe(booking.graduates, 10)} คน`,
    `มหาวิทยาลัย: ${safe(booking.university)}`,
    `คณะ: ${safe(booking.faculty)}`,
    `ยอดรวม: ${Number(booking.total_price).toLocaleString("th-TH")} บาท`,
  ]
    .join("\n")
    .slice(0, 4000);
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/production-controls.test.ts tests/unit/security-boundaries.test.ts
```

Expected: both files PASS.

- [ ] **Step 5: Commit the formatter/config boundary**

```bash
git add lib/notifications/telegram-config.ts lib/notifications/format-booking.ts tests/unit/production-controls.test.ts tests/unit/security-boundaries.test.ts
git commit -m "feat: add Telegram notification configuration"
```

### Task 2: Server-only Telegram transport

**Files:**
- Create: `lib/notifications/telegram.ts`
- Create: `tests/unit/telegram.test.ts`

**Interfaces:**
- Consumes: `getTelegramConfig(process.env)` and `buildBookingCreatedMessage(booking)` from Task 1.
- Produces: `TelegramDeliveryResult`, `sendTelegramMessage(message: string, dependencies?: TelegramTransportDependencies): Promise<TelegramDeliveryResult>`, and `sendBookingCreatedNotification(booking: BookingNotification): Promise<TelegramDeliveryResult>`.

- [ ] **Step 1: Write failing transport tests**

Create `tests/unit/telegram.test.ts`:

```ts
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
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).not.toHaveProperty(
      "parse_mode"
    );
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
    await expect(sendTelegramMessage("hello", dependencies(http))).resolves.toEqual({
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

    const network = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline"));
    await expect(
      sendTelegramMessage("hello", dependencies(network))
    ).resolves.toEqual({ ok: false, code: "TELEGRAM_NETWORK_ERROR" });
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/unit/telegram.test.ts
```

Expected: FAIL because `lib/notifications/telegram.ts` does not exist.

- [ ] **Step 3: Implement the minimal server-only transport**

Create `lib/notifications/telegram.ts`:

```ts
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
```

- [ ] **Step 4: Run transport tests, lint, and typecheck**

Run:

```bash
npm test -- tests/unit/telegram.test.ts
npm run lint
npm run typecheck
```

Expected: all three commands exit 0.

- [ ] **Step 5: Commit the transport**

```bash
git add lib/notifications/telegram.ts tests/unit/telegram.test.ts
git commit -m "feat: add Telegram notification transport"
```

### Task 3: Wire the outbox and operational alerts to Telegram

**Files:**
- Modify: `lib/notifications/outbox.ts`
- Modify: `lib/monitoring.ts`
- Create: `tests/unit/monitoring.test.ts`

**Interfaces:**
- Consumes: `sendBookingCreatedNotification` and `sendTelegramMessage` from Task 2.
- Produces: the unchanged public `processOutboxItem`/`processPendingNotifications` behavior plus `buildOperationalAlertMessage(input): string` and Telegram-backed `reportOperationalError(input): Promise<void>`.

- [ ] **Step 1: Write failing operational-alert tests**

Create `tests/unit/monitoring.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/unit/monitoring.test.ts
```

Expected: FAIL because `buildOperationalAlertMessage` is not exported and `reportOperationalError` still uses Discord.

- [ ] **Step 3: Implement Telegram operational alerts**

Keep `LogLevel`, `safeToken`, and `logServerEvent` unchanged in `lib/monitoring.ts`. Add the Telegram import immediately after `server-only`:

```ts
import { sendTelegramMessage } from "@/lib/notifications/telegram";
```

Replace `reportOperationalError` with:

```ts
type OperationalErrorInput = {
  event: string;
  requestId?: string;
  code: string;
  durationMs?: number;
};

export function buildOperationalAlertMessage(input: OperationalErrorInput) {
  return [
    "Nimman Foto operational alert",
    `event: ${safeToken(input.event)}`,
    `code: ${safeToken(input.code)}`,
    input.requestId ? `request: ${safeToken(input.requestId)}` : null,
    typeof input.durationMs === "number"
      ? `duration: ${Math.max(0, Math.round(input.durationMs))}ms`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);
}

export async function reportOperationalError(input: OperationalErrorInput) {
  logServerEvent({ level: "error", ...input });
  const result = await sendTelegramMessage(buildOperationalAlertMessage(input));
  if (!result.ok) {
    logServerEvent({
      level: "warn",
      event: "operational_alert_delivery",
      requestId: input.requestId,
      code: result.code,
    });
  }
}
```

- [ ] **Step 4: Wire outbox delivery and PII-free failure logs**

In `lib/notifications/outbox.ts`, replace imports with:

```ts
import { sendBookingCreatedNotification } from "@/lib/notifications/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerEvent, reportOperationalError } from "@/lib/monitoring";
```

Immediately after `if (updateError) throw new Error("OUTBOX_UPDATE_FAILED");` in the Telegram failure branch and before the exhausted-attempt check, add:

```ts
  logServerEvent({
    level: "warn",
    event: "booking_notification_delivery",
    requestId: item.id,
    code: result.code,
  });
```

Do not change the success update, failure backoff calculation, or booking route response handling.

- [ ] **Step 5: Run focused and regression tests**

Run:

```bash
npm test -- tests/unit/monitoring.test.ts tests/unit/telegram.test.ts tests/unit/security-boundaries.test.ts
npm run typecheck
```

Expected: all commands exit 0; the alert-delivery test shows exactly one Telegram attempt and one warning.

- [ ] **Step 6: Commit the runtime wiring**

```bash
git add lib/notifications/outbox.ts lib/monitoring.ts tests/unit/monitoring.test.ts
git commit -m "feat: route booking and operational alerts to Telegram"
```

### Task 4: Atomic operator-only replay for one failed booking

**Files:**
- Create: `lib/notifications/replay.ts`
- Create: `scripts/replay-booking-notification.ts`
- Create: `tests/unit/notification-replay.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `createAdminClient()` and `processOutboxItem(item)` from existing server-only code.
- Produces: `parseReplayBookingNumber(arguments_: string[]): string`, `requireFailedReplayCandidate(candidate): FailedReplayCandidate`, and `npm run notify:replay -- NF-YYYYMMDD-NNNN`.

- [ ] **Step 1: Write failing replay guard tests**

Create `tests/unit/notification-replay.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  parseReplayBookingNumber,
  requireFailedReplayCandidate,
} from "@/lib/notifications/replay";

describe("operator notification replay guards", () => {
  it("accepts exactly one canonical booking number", () => {
    expect(parseReplayBookingNumber(["NF-20260720-0001"])).toBe(
      "NF-20260720-0001"
    );
    expect(() => parseReplayBookingNumber([])).toThrow("REPLAY_BOOKING_REQUIRED");
    expect(() => parseReplayBookingNumber(["NF-1", "NF-2"])).toThrow(
      "REPLAY_BOOKING_REQUIRED"
    );
    expect(() => parseReplayBookingNumber(["nf-20260720-0001"])).toThrow(
      "REPLAY_BOOKING_INVALID"
    );
  });

  it("allows only a failed booking_created outbox row", () => {
    const failed = {
      id: "outbox-id",
      booking_id: "booking-id",
      event_type: "booking_created",
      attempts: 1,
      status: "failed",
    };
    expect(requireFailedReplayCandidate(failed)).toEqual(failed);
    expect(() =>
      requireFailedReplayCandidate({ ...failed, status: "sent" })
    ).toThrow("REPLAY_ALREADY_SENT");
    expect(() =>
      requireFailedReplayCandidate({ ...failed, status: "processing" })
    ).toThrow("REPLAY_NOT_FAILED");
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/unit/notification-replay.test.ts
```

Expected: FAIL because `lib/notifications/replay.ts` does not exist.

- [ ] **Step 3: Implement pure argument and status guards**

Create `lib/notifications/replay.ts`:

```ts
type ReplayCandidate = {
  id: string;
  booking_id: string;
  event_type: string;
  attempts: number;
  status: string;
};

export type FailedReplayCandidate = ReplayCandidate & {
  event_type: "booking_created";
  status: "failed";
};

export function parseReplayBookingNumber(arguments_: string[]) {
  if (arguments_.length !== 1) throw new Error("REPLAY_BOOKING_REQUIRED");
  const bookingNumber = arguments_[0];
  if (!/^NF-\d{8}-\d{4}$/.test(bookingNumber)) {
    throw new Error("REPLAY_BOOKING_INVALID");
  }
  return bookingNumber;
}

export function requireFailedReplayCandidate(
  candidate: ReplayCandidate
): FailedReplayCandidate {
  if (candidate.event_type !== "booking_created") {
    throw new Error("REPLAY_EVENT_INVALID");
  }
  if (candidate.status === "sent") throw new Error("REPLAY_ALREADY_SENT");
  if (candidate.status !== "failed") throw new Error("REPLAY_NOT_FAILED");
  return candidate as FailedReplayCandidate;
}
```

- [ ] **Step 4: Run replay guard tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/notification-replay.test.ts
```

Expected: PASS.

- [ ] **Step 5: Install the exact TypeScript runner and add the operator command**

Run:

```bash
npm install --save-dev --save-exact tsx@4.23.1
```

Add this script to `package.json`:

```json
"notify:replay": "node --conditions=react-server --import tsx scripts/replay-booking-notification.ts"
```

Expected: `package.json` and `package-lock.json` record `tsx` 4.23.1; no production dependency is added.

- [ ] **Step 6: Implement the compare-and-set replay command**

Create `scripts/replay-booking-notification.ts`:

```ts
import { processOutboxItem } from "@/lib/notifications/outbox";
import {
  parseReplayBookingNumber,
  requireFailedReplayCandidate,
} from "@/lib/notifications/replay";
import { createAdminClient } from "@/lib/supabase/admin";

function errorCode(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/[^A-Z0-9_]/gi, "_").slice(0, 100)
    : "REPLAY_FAILED";
}

async function main() {
  const bookingNumber = parseReplayBookingNumber(process.argv.slice(2));
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_no", bookingNumber)
    .maybeSingle();
  if (bookingError) throw new Error("REPLAY_BOOKING_LOOKUP_FAILED");
  if (!booking) throw new Error("REPLAY_BOOKING_NOT_FOUND");

  const { data: row, error: rowError } = await supabase
    .from("notification_outbox")
    .select("id,booking_id,event_type,attempts,status")
    .eq("booking_id", booking.id)
    .eq("event_type", "booking_created")
    .maybeSingle();
  if (rowError) throw new Error("REPLAY_OUTBOX_LOOKUP_FAILED");
  if (!row) throw new Error("REPLAY_OUTBOX_NOT_FOUND");
  const candidate = requireFailedReplayCandidate(row);

  const { data: claimed, error: claimError } = await supabase
    .from("notification_outbox")
    .update({
      status: "processing",
      attempts: candidate.attempts + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidate.id)
    .eq("status", "failed")
    .eq("attempts", candidate.attempts)
    .select("id,booking_id,event_type,attempts")
    .maybeSingle();
  if (claimError) throw new Error("REPLAY_CLAIM_FAILED");
  if (!claimed) throw new Error("REPLAY_ALREADY_CLAIMED");

  const sent = await processOutboxItem({
    id: claimed.id,
    booking_id: claimed.booking_id,
    event_type: "booking_created",
    attempts: claimed.attempts,
  });
  if (!sent) throw new Error("REPLAY_DELIVERY_FAILED");

  console.log(
    JSON.stringify({
      event: "booking_notification_replay",
      bookingNumber,
      result: "sent",
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "booking_notification_replay",
      code: errorCode(error),
      result: "failed",
    })
  );
  process.exitCode = 1;
});
```

The command prints only the booking number on success and a sanitized error code on failure; it never prints customer fields, Telegram credentials, chat ID, Bot API URL, message text, or response body.

- [ ] **Step 7: Verify the command boundary without touching production**

Run:

```bash
npm run notify:replay -- invalid
npm test -- tests/unit/notification-replay.test.ts
npm run typecheck
```

Expected: the first command exits non-zero with `REPLAY_BOOKING_INVALID`; tests and typecheck exit 0. Do not run a valid booking number until production rollout Task 6.

- [ ] **Step 8: Commit the operator replay tooling**

```bash
git add lib/notifications/replay.ts scripts/replay-booking-notification.ts tests/unit/notification-replay.test.ts package.json package-lock.json
git commit -m "feat: add guarded notification replay command"
```

### Task 5: Remove Discord runtime and update operator/privacy documentation

**Files:**
- Delete: `lib/notifications/discord.ts`
- Delete: `lib/notifications/discord-config.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/security-hardening.md`
- Modify: `docs/backup-runbook.md`
- Modify: `app/privacy/page.tsx`

**Interfaces:**
- Consumes: Telegram environment names and operator command from Tasks 1-4.
- Produces: Telegram-only runtime/docs with no active Discord configuration contract.

- [ ] **Step 1: Remove the unused Discord modules**

Delete both files with `apply_patch`:

```text
lib/notifications/discord.ts
lib/notifications/discord-config.ts
```

- [ ] **Step 2: Replace the server-only notification example**

Replace the server-only block in `.env.example` with:

```dotenv
# Server-only configuration
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
RATE_LIMIT_HASH_SECRET=
CRON_SECRET=
```

- [ ] **Step 3: Update exact documentation language**

Apply these exact documentation replacements:

```text
README.md
- "Discord notifications" -> "Telegram notifications"
- required variables `DISCORD_WEBHOOK_URL` and `OPERATIONAL_ALERT_WEBHOOK_URL` -> `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, both server-only and scoped to the approved private chat
- deployment verification must include Telegram test delivery and `npm run notify:replay -- NF-YYYYMMDD-NNNN` only for a known failed row

docs/security-hardening.md
- "Discord outbox event" -> "notification outbox event"
- heading "Discord outbox and retry" -> "Telegram outbox and retry"
- Discord failure wording -> Telegram failure wording while preserving the statement that booking creation is never rolled back
- operational alert variable -> `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_CHAT_ID`
- production verification wording -> never create a fake booking or fake operational error; use an explicit Telegram test message

docs/backup-runbook.md
- restore drill wording -> never use the production Telegram bot token or chat ID in the drill environment

app/privacy/page.tsx
- Thai provider name "Discord" -> "Telegram" without changing the surrounding disclosure
```

- [ ] **Step 4: Prove no active runtime or current docs still reference Discord**

Run:

```bash
rg -n "Discord|discord|DISCORD_WEBHOOK_URL|OPERATIONAL_ALERT_WEBHOOK_URL" app lib tests README.md .env.example docs/security-hardening.md docs/backup-runbook.md
```

Expected: exit 1 with no matches. Historical approved design documents and Supabase's provider-list comment are outside this assertion and remain unchanged.

- [ ] **Step 5: Run unit tests and build after deletion**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all four commands exit 0, and the production bundle has no missing Discord imports.

- [ ] **Step 6: Commit Telegram-only docs and cleanup**

```bash
git add .env.example README.md docs/security-hardening.md docs/backup-runbook.md app/privacy/page.tsx lib/notifications/discord.ts lib/notifications/discord-config.ts
git commit -m "docs: document Telegram-only notifications"
```

### Task 6: Full verification, production rollout, replay, and rollback gate

**Files:**
- Verify: all files changed in Tasks 1-5
- No database migrations or RLS changes

**Interfaces:**
- Consumes: existing GitHub Actions/Vercel Git workflow, production Vercel project, Supabase outbox, Telegram bot, and replay command.
- Produces: a production deployment where both notification categories use Telegram and `NF-20260720-0001` is delivered once.

- [ ] **Step 1: Run the complete local quality gate**

Run:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm audit --audit-level=high
```

Expected: lint/typecheck/coverage/build exit 0, coverage remains above statements 85%, branches 80%, functions 90%, and lines 85%, and audit reports no high/critical vulnerability introduced by `tsx`.

- [ ] **Step 2: Run disposable-Supabase integration and browser gates**

Run the same local Supabase and integration/E2E sequence used by `.github/workflows/ci.yml`:

```powershell
npx --yes supabase@2.109.1 start
npx --yes supabase@2.109.1 db reset
$supabaseStatus = npx --yes supabase@2.109.1 status -o json | ConvertFrom-Json
$env:NEXT_PUBLIC_SUPABASE_URL = $supabaseStatus.API_URL
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $supabaseStatus.ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $supabaseStatus.SERVICE_ROLE_KEY
$env:RUN_SUPABASE_INTEGRATION = "1"
npm run test:integration
npx --yes supabase@2.109.1 db lint --local --level warning --fail-on error
$env:RUN_E2E = "1"
npm run test:e2e
```

Expected: database reset, integration tests, database lint, and Playwright E2E all exit 0. No production data or Telegram credentials are used.

- [ ] **Step 3: Review the exact change and secret boundary**

Run:

```bash
git diff origin/main...HEAD --check
git status --short
git log --oneline origin/main..HEAD
rg -n "api\.telegram\.org/bot[0-9]|TELEGRAM_BOT_TOKEN=.+|TELEGRAM_CHAT_ID=.+" . -g "!node_modules/**" -g "!.git/**"
```

Expected: diff check is clean, worktree is clean, commits are intentional, and the secret scan returns no committed values.

- [ ] **Step 4: Prepare Telegram without exposing credentials**

In Telegram, send a fresh `/start` to `Nimman Studio Notify`. Using a trusted API client that does not persist request history, validate the BotFather token with `getMe`, call `getWebhookInfo`, and call `getUpdates` only if the webhook URL is empty. Telegram retains updates for at most 24 hours, so use the fresh `/start` result to confirm the intended private chat and capture its numeric `chat.id` as a string. Do not save or paste the update payload into source control, task chat, shell history, or logs.

Expected: `getMe` returns `ok: true`, the selected update belongs to the approved private chat, and no webhook conflict exists.

- [ ] **Step 5: Configure production secrets and pre-deploy delivery**

In the Vercel project settings, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as encrypted Production-only environment variables. Do not delete the old Discord variables yet. From the same trusted API client, call `sendMessage` once with the exact text `Nimman Foto Telegram production test` and no parse mode.

Expected: Telegram returns HTTP 200 with `{ "ok": true }`, and exactly one visible test message appears in the approved chat.

- [ ] **Step 6: Publish through the existing workflow**

Run:

```bash
git push -u origin codex/telegram-notifications
gh pr create --base main --head codex/telegram-notifications --title "Replace Discord notifications with Telegram" --body-file docs/superpowers/specs/2026-07-20-telegram-notifications-design.md
gh pr checks --watch
```

Expected: the PR is created, every required GitHub Actions check passes, review is complete, and merge triggers the existing Vercel production deployment. Do not promote a deployment with a failed or pending required check.

- [ ] **Step 7: Run read-only production smoke before replay**

Check `https://grad.jirayufoto.net`, the booking availability/read-only paths, authentication redirect, Vercel deployment health, and runtime logs. Confirm the new deployment is serving the merged commit and that no `TELEGRAM_*` errors, secret values, message bodies, or unexpected 5xx responses appear.

Expected: read-only smoke passes and the application is healthy. If any smoke check fails, immediately execute Step 10 and do not replay the booking.

- [ ] **Step 8: Replay the known failed booking exactly once**

Run the operator command once from a trusted environment containing the production Supabase and Telegram server-only variables:

```bash
npm run notify:replay -- NF-20260720-0001
```

Expected: one JSON success event, exactly one Telegram booking message, and the corresponding `notification_outbox` row changes from `failed` to `sent` with non-null `sent_at` and null `last_error`. A second invocation must exit non-zero with `REPLAY_ALREADY_SENT` and must not send another Telegram message.

- [ ] **Step 9: Verify ongoing booking and operational paths**

For the next real booking, verify its outbox row reaches `sent` and one Telegram booking message arrives. Verify the next naturally occurring operational error, or a non-production controlled error, produces one sanitized operational alert; do not generate a fake production customer booking or fake production error solely for this check. After the smoke window passes, remove the unused production Discord variables in a separate reversible configuration change.

Expected: both selected notification categories use the approved Telegram chat and runtime code makes no Discord request.

- [ ] **Step 10: Roll back immediately on any failed smoke or delivery gate**

Promote Vercel deployment `dpl_6dD4FR1qEXqdKgdayWRmxJuQeybG` (commit `b2d7914038e5738e2dfa6280a6f64ce6fde95e75`) back to Production using the established rollback control. Leave all booking/outbox rows and Telegram secrets intact, stop replay attempts, and record only sanitized failure codes for diagnosis.

Expected: the previous production deployment is active, customer data is unchanged, and failed outbox rows remain retryable.

---

## Self-review record

- Spec coverage: booking delivery, operational alerts, Telegram-only configuration, plain-text length and sanitization, preserved HTTP 201/outbox behavior, non-recursive logging, guarded replay, Discord removal, CI, deploy, smoke, and rollback each map to Tasks 1-6.
- Placeholder scan: implementation snippets contain complete signatures, error codes, commands, and expected results; no deferred implementation markers remain.
- Type consistency: `BookingNotification`, `TelegramDeliveryResult`, `TelegramTransportDependencies`, `FailedReplayCandidate`, and the `processOutboxItem` claim shape use the same names and fields across all tasks.
