# Production Security Baseline

Captured before the July 2026 production hardening rollout. This document
contains schema metadata only. It intentionally excludes customer records,
identifiers, credentials, tokens, webhook URLs, and environment values.

## Application

- Branch: `main`
- Baseline application commit: `3e71c54`
- Hosting: Vercel, Next.js 16, Node.js 24
- Existing local environment names:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- No repository GitHub Actions, `vercel.json`, or `.env.example` existed.
- `/api/notify/booking` had no application caller and accepted anonymous input.

## Authentication

- Supabase Auth contained one existing user.
- Admin authorization was enforced only by the client-side `AdminGuard`.
- No `admin_users` role table existed.

## Public Schema

- `bookings` included booking/customer fields, `start_time`, `end_time`,
  `deposit_amount`, `remaining_amount`, and the legacy `slip_url` column.
- `blocked_slots` had a unique `(booking_date, period)` constraint.
- `blocked_dates` existed but was unused by the application.
- `page_views` counted requests rather than unique visitors.
- `site_settings` did not exist; the application used the private
  `site-config/site-settings.json` fallback.
- The existing active-slot index covered only `pending` and `confirmed`.
- No occupying-slot conflicts existed across `pending`, `paid`, `confirmed`,
  and `completed` at capture time.
- A legacy `SECURITY DEFINER` Telegram notification function and booking insert
  trigger existed outside the repository schema.

## RLS And Grants

Policies present at capture time:

- `bookings`: anonymous INSERT allowed (`Public Insert Booking`).
- `bookings`: anonymous SELECT allowed for every row (`Public Read Booking`).
- `storage.objects`: anonymous SELECT allowed for the `slips` bucket.
- `storage.objects`: anonymous INSERT allowed for the `slips` bucket.

The `anon` and `authenticated` roles also held broad table grants inherited
from the original schema setup. The hardening migration revokes application
table privileges and removes the broad policies after the compatible app is
deployed.

## Storage

- `slips`: public, 34 objects.
- `payment-slips`: public, empty.
- `site-config`: private, one settings object.
- 29 bookings referenced a legacy public slip URL.
- All 29 URLs were parseable and matched an object in `slips`.

## Rollback Reference

- `bookings.slip_url` is retained during the compatibility period.
- No booking, customer field, or slip object is deleted by either migration.
- The hardening migration can temporarily be rolled back by restoring bucket
  visibility, but broad booking SELECT/INSERT policies should not be restored.
- Roll application code forward when possible. See
  `docs/security-hardening.md` for the staged deployment and recovery process.
