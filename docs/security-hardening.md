# Production Security Hardening

This document describes the production security model for Nimman Foto Booking.
It contains no customer data, credentials, tokens, or webhook values.

## Auth architecture

Supabase Auth owns the admin login session. `proxy.ts` refreshes the SSR cookie,
while `lib/auth/require-admin.ts` calls `auth.getUser()`, checks the user in
`admin_users`, and fails closed unless the authenticator assurance level is
`aal2`. The client-side `AdminGuard` is only a UX layer.

## Admin role provisioning

Create an Auth user in Supabase, then insert that user's UUID into
`admin_users` with `role = 'owner'` or `role = 'admin'` and `active = true`.
Do not enable public signup. Deactivate an admin by setting `active = false`.
Every active admin enrolls TOTP at `/login/mfa`; password-only sessions cannot
access server-rendered admin pages or admin actions.

## RLS model

Public clients never query bookings, blocked slots, audit logs, rate limits,
outbox rows, or private slip metadata directly. Public booking operations go
through server routes using the service role. The hardening migration revokes
direct `anon` and `authenticated` table privileges and removes broad legacy
policies.

## Private slip access

New bookings store only `slip_path`. The `slips` bucket is private and the admin
detail page creates a short-lived signed URL server-side. `slip_url` is retained
only as a legacy transition column and is never returned by customer APIs.

Before applying the stage 2 migration, confirm the stage 1 backfill checks pass.

## Atomic booking flow

The server validates the date, time slot, package, graduates, phone, text limits,
and file signature. `create_booking_atomic` locks the date/period, checks active
bookings and blocked slots, allocates a Bangkok daily counter, inserts the booking,
and inserts the Discord outbox event in one transaction.

## Pricing source of truth

The server and database RPC calculate package price, additional graduates,
deposit, and remaining amount. Client-supplied price fields are not accepted as
the stored source of truth.

## Booking access sessions

New customer access uses a random 256-bit token. Only its SHA-256 hash is stored;
the raw token is in an HttpOnly, Secure-in-production, SameSite=Lax cookie with a
24-hour lifetime. The status endpoint verifies the session booking id and booking
number before returning customer-safe fields. Legacy query tokens are accepted
only until `LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL`, then exchanged for a cookie.

## Rate limiting

Rate limits use the `api_rate_limits` table and an atomic Postgres function. The
platform-provided client IP is HMAC-hashed with `RATE_LIMIT_HASH_SECRET`; raw IP
values are not stored or logged. User-Agent is intentionally excluded because it
is attacker-controlled. Lookup is limited to 6 requests per 10 minutes per IP.

## Discord outbox and retry

Booking creation inserts a unique `booking_created` outbox event. The server tries
to send it immediately, while `/api/cron/maintenance` retries failed events with
bounded exponential backoff. Discord failures never roll back a successful
booking. `/api/notify/booking` is intentionally closed to anonymous callers.

## Audit log

Status changes, slot/day blocks, portfolio updates, and password changes are
recorded in `audit_logs`. Status changes and their audit record are performed by
the same database RPC transaction. Public clients cannot read audit records.

## Privacy notice and retention

The public booking form requires the current `PRIVACY_NOTICE_VERSION`, and the
database records both the version and a server-side acknowledgement timestamp.
The notice is published at `/privacy`.

When `CUSTOMER_DATA_RETENTION_DAYS` is configured, maintenance anonymizes only
completed/cancelled bookings older than the cutoff, removes payment slips and
customer access sessions, and writes a count-only audit record. Processing is
bounded to 50 rows per run and rechecks status and cutoff before redaction. Keep
retention disabled until the owner has approved the chosen 365-3650 day period.

## Visitor analytics

The booking page sends a first-party random visitor cookie. Only its HMAC hash is
stored in `page_visitors`, so reloads count as one approximate unique visitor.
The dashboard counts visitors whose `last_seen_at` is within 24 hours. Legacy
`page_views` remains for transition and is no longer written.

## Maintenance cron

Vercel Cron calls `/api/cron/maintenance` with `Authorization: Bearer $CRON_SECRET`.
The job removes expired rate-limit/session records, old visitor rows, sent outbox
rows, retries notifications, and can clean orphan slips in small batches.

Orphan slip deletion is disabled unless `ORPHAN_SLIP_RETENTION_HOURS` is explicitly
configured to a value between 24 and 8760 hours. Valid referenced slips are never
deleted.

Maintenance emits structured, PII-free logs with request IDs and durations.
Terminal notification failures and cron failures are sent to the dedicated
`OPERATIONAL_ALERT_WEBHOOK_URL` when configured. Vercel Analytics and Speed
Insights provide aggregate traffic and performance signals.

## Site settings validation

Instagram and Facebook values are accepted only as HTTPS URLs on their expected
hostnames. Updates require an authenticated admin and are audited. The private
`site-config` storage fallback remains available for backward compatibility.

## Required environment variables

Set these in Vercel only; do not commit values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DISCORD_WEBHOOK_URL`
- `RATE_LIMIT_HASH_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `OPERATIONAL_ALERT_WEBHOOK_URL`
- `LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL`
- `ORPHAN_SLIP_RETENTION_HOURS` (optional, destructive cleanup opt-in)
- `CUSTOMER_DATA_RETENTION_DAYS` (optional, privacy retention opt-in)

## Migration and deployment order

1. Back up production schema, policies, bucket settings, and verify the legacy slip references.
2. Apply `20260710084422_production_security_additive.sql`.
3. Deploy the compatible application and verify availability, create, lookup, and admin flows.
4. Verify every legacy slip has a matching `slip_path` object.
5. Apply `20260710084436_production_security_hardening.sql` to close public access and make slips private.
6. Apply later migrations, including dashboard aggregation, private bucket enforcement, explicit service-role grants, and privacy-retention columns.
7. Push Auth configuration so TOTP enrollment/verification is enabled.
8. Configure environment variables, Node.js 24.x, Vercel Cron, and the alert webhook.
9. Enroll every active admin in TOTP and verify AAL2 enforcement.
10. Run smoke and security checks without creating a fake production booking.

## Encrypted backups

Use `scripts/backup-production.ps1` to export roles, schema, data, and both
private storage buckets into an age-encrypted archive. Use
`scripts/verify-backup.ps1` to decrypt into a unique temporary directory and
verify every checksum. Follow `docs/backup-runbook.md` for retention, off-site
copies, alerting, and quarterly restore drills.

## Recovery and rollback

Do not drop columns or delete customer rows during rollback. Roll the application
forward when possible. If emergency legacy slip access is required, restore only
the narrowest temporary storage access after confirming the incident, then close
it again. Keep `slip_url` and legacy token compatibility until the documented
transition windows end.

## Admin and session operations

Add admins only through Supabase Auth plus `admin_users`; public signup stays off.
To revoke one customer session, set its `revoked_at`. To revoke all sessions for
a booking, update all active rows for that `booking_id`. The server helpers expose
both operations without returning tokens.

## Orphan slip review

Before enabling cleanup, query `bookings.slip_path` and legacy `slip_url` references,
compare them with `storage.objects`, and review the candidate count. Start with a
long grace period and a small batch. Never use a booking number or customer name
as an object path or log value.

## Verification checklist

- Unauthenticated `/admin` redirects to `/login`.
- Non-admin Auth users cannot render admin pages or call admin actions.
- Password-only admin sessions redirect to `/login/mfa`; AAL2 sessions can access `/admin`.
- Anonymous Supabase access cannot select/update/delete bookings.
- Direct public slip URLs fail after the stage 2 migration.
- New success URLs contain only `bookingNo`, never a new access token.
- Availability and create use the same occupying statuses.
- `supabase db reset` succeeds from a clean local stack.
- RLS integration tests connect successfully before checking permission-denied errors.
- Privacy acknowledgement version and timestamp are persisted by the database.
- `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:integration`, and `npm run build` pass.
- `supabase db lint --local --level warning --fail-on error` reports no errors.
- E2E smoke tests run against a dedicated non-production URL with `E2E_BASE_URL`.
- Production verification never creates fake customer bookings or sends fake Discord notifications.
