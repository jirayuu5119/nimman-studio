# Telegram-only notification design

Date: 2026-07-20
Status: Approved

## Context and root cause

The production booking flow is healthy. Booking `NF-20260720-0001` was created successfully and `/api/bookings/create` returned HTTP 201, but its notification outbox row was marked `failed` with `DISCORD_NETWORK_ERROR`. Earlier rows, including the booking from 2026-07-18, were sent successfully. Discord's public status page reported its API operational, so the failure boundary is the deployment-to-webhook connection rather than booking creation or Supabase persistence.

The current implementation deliberately allows a booking to succeed when notification delivery fails. It stores the failure in `notification_outbox`, but the generic network error loses diagnostic detail and the daily maintenance cron may delay a retry until the next scheduled run.

## Goals

- Deliver new-booking notifications through Telegram only.
- Deliver operational error alerts through the same Telegram bot and private chat.
- Preserve the existing booking transaction, Supabase outbox, retry state, and customer response behavior.
- Make delivery failures diagnosable without logging credentials, customer message bodies, or Telegram response bodies.
- Replay the currently failed booking notification after the Telegram rollout.
- Keep rollback possible without changing booking data.

## Non-goals

- No Discord fallback or dual delivery.
- No customer-facing Telegram messages.
- No Telegram commands, long-polling worker, or conversational bot behavior.
- No admin UI for editing notification credentials.
- No public or admin HTTP endpoint for replaying notifications.
- No database schema or RLS changes.
- No changes to booking pricing, availability, payment, authentication, or customer data retention.

## Options considered

1. A single Telegram provider using the existing outbox. This is selected because it is the smallest reliable change and preserves current delivery semantics.
2. Separate Telegram chats for bookings and operations. This adds useful separation but requires more credentials and was not requested.
3. A generic multi-provider framework. This would support future channels but adds unnecessary abstraction for a Telegram-only requirement.

## Architecture

### Telegram transport

Create a server-only Telegram transport with one responsibility: POST a plain-text message to the Telegram Bot API `sendMessage` method.

Configuration comes only from server-side environment variables:

- `TELEGRAM_BOT_TOKEN`: bot token from BotFather.
- `TELEGRAM_CHAT_ID`: the private chat that has already sent a message to the bot.

The transport must never expose these values to browser code or logs. It returns a small typed result:

- success: `{ ok: true }`
- missing configuration: `TELEGRAM_NOT_CONFIGURED`
- non-2xx Telegram response: `TELEGRAM_HTTP_<status>`
- HTTP success without Telegram's `{ ok: true }` confirmation: `TELEGRAM_INVALID_RESPONSE`
- abort/timeout: `TELEGRAM_TIMEOUT`
- other fetch failure: `TELEGRAM_NETWORK_ERROR`

The transport uses an 8-second timeout, `cache: "no-store"`, and plain text rather than Telegram Markdown or HTML. Plain text prevents user-entered booking fields from changing formatting or creating unexpected entities. Messages are bounded below Telegram's 4,096-character `sendMessage` limit.

### Message formatting

Rename the current Discord-specific booking type and formatter to channel-neutral names. The booking message includes the existing operational fields: booking number, customer name, phone, LINE, date, time, graduate count, university, faculty, and total price.

Formatting removes control characters, trims individual values, and bounds the final output. No secret values, slip URLs, access tokens, or internal database IDs are included.

Operational alerts use the same transport and contain only:

- a fixed Nimman Foto operational-alert heading
- sanitized event name
- sanitized error code
- sanitized request ID when available
- rounded duration when available

### Booking data flow

1. `create_booking_atomic` continues to create the booking and its outbox row in one database transaction.
2. `/api/bookings/create` continues attempting that outbox item after the booking is committed.
3. The outbox loads the booking fields and calls the Telegram booking sender.
4. On success, the row becomes `sent` and receives `sent_at`.
5. On failure, the row remains retryable with a sanitized Telegram error code and exponential backoff.
6. The customer still receives HTTP 201 when notification delivery fails.

### Operational-alert data flow

`reportOperationalError` keeps structured Vercel logging and then uses the Telegram transport. A Telegram delivery failure produces a warning event with a sanitized Telegram error code. It must not recursively call `reportOperationalError`.

### Operator-only replay

Add a non-HTTP operator script that accepts one booking number, loads only its failed outbox row, and calls the same `processOutboxItem` path used by production. It refuses rows already marked `sent`, does not print customer fields or credentials, and exits unsuccessfully unless Telegram confirms delivery. This provides an auditable, idempotency-guarded way to replay `NF-20260720-0001` without running unrelated maintenance tasks.

### Removal of Discord behavior

- Remove Discord transport and Discord webhook selection logic from runtime use.
- Remove `DISCORD_WEBHOOK_URL` and `OPERATIONAL_ALERT_WEBHOOK_URL` from required application configuration and documentation.
- Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to `.env.example` and deployment documentation.
- Production Discord secrets remain untouched until Telegram production smoke passes, then may be removed separately. The deployed code will not read them.

## Observability and failure handling

- Log one structured warning when Telegram delivery fails, including event type, outbox/request ID, and sanitized error code.
- Never log bot tokens, complete request URLs, chat IDs, customer message bodies, or Telegram response bodies.
- Preserve `notification_outbox.last_error` as the source of truth for booking delivery failures.
- Continue the existing exponential-backoff behavior and daily maintenance processing.
- Do not retry within the customer request beyond the single immediate attempt; this keeps booking latency bounded.

## Security

- Both Telegram values are server-only Vercel secrets with Production scope.
- Validate configuration as non-empty strings before constructing a request.
- Construct the Bot API URL only inside server-only code.
- Use POST JSON and plain text; do not place message content in query parameters.
- Keep the current Supabase service-role boundary and outbox RLS/privileges unchanged.
- Discover the chat ID using Telegram `getUpdates` only after the user has initiated the bot chat. Do not persist update payloads.

## Testing strategy

Implementation follows test-driven development:

1. Add failing unit tests for Telegram configuration and plain-text formatting limits/sanitization.
2. Add failing transport tests for success, missing configuration, HTTP failure, timeout, and network failure.
3. Add failing tests proving operational alerts call the Telegram transport and sanitize their payload.
4. Update existing Discord-specific contract tests to Telegram-neutral expectations.
5. Run lint, typecheck, unit coverage, integration tests, production build, and the existing E2E suite.
6. CI with disposable Supabase remains the authority for migrations, outbox boundaries, and booking E2E.

## Rollout

1. Obtain the bot token from BotFather without placing it in source control or chat history.
2. Confirm the bot identity with Telegram `getMe`.
3. Derive the intended private chat ID from `getUpdates` and confirm the chat title/type without retaining the update payload. Telegram retains incoming updates for at most 24 hours, so if the existing `hello` update is no longer available, ask the user to send a fresh `/start` message and repeat this step.
4. Store `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as Production secrets in Vercel.
5. Send one explicit test message to the selected chat.
6. Deploy through the existing pull-request, GitHub Actions, and Vercel Git workflow.
7. Smoke-test the existing read-only production routes and inspect runtime logs; do not create a fake production error solely to test operational alerts.
8. Run the operator-only replay script for `NF-20260720-0001`. The normal outbox processor marks the row `sent` only after Telegram confirms success.
9. Verify subsequent new bookings are marked `sent` and appear in Telegram.

## Rollback

If build, CI, production smoke, or Telegram delivery fails:

- Roll back the application to production deployment `dpl_6dD4FR1qEXqdKgdayWRmxJuQeybG` / commit `b2d7914038e5738e2dfa6280a6f64ce6fde95e75`.
- Leave booking and outbox rows intact so they remain retryable.
- Do not delete or rewrite customer bookings.
- Keep Telegram secrets available for diagnosis but do not log or expose them.

## Acceptance criteria

- A new booking still returns HTTP 201 independently of notification delivery.
- A successful Telegram delivery marks its outbox row `sent`.
- A failed Telegram delivery records a specific sanitized `TELEGRAM_*` error and remains retryable.
- Booking and operational messages both arrive in the approved private Telegram chat.
- Discord is not called by runtime notification code.
- The failed `NF-20260720-0001` message is delivered exactly once during rollout.
- No Telegram credentials or customer message bodies appear in source control or logs.
- All local and CI quality gates pass before production promotion.
