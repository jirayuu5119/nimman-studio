# Nimman Foto Booking

Production booking system for Nimman Foto, built with Next.js 16, Supabase,
private payment-slip storage, an admin dashboard, and Telegram notifications.

## Requirements

- Node.js 24.x (matches production and GitHub Actions)
- npm
- Docker Desktop for the local Supabase stack
- Supabase CLI 2.109.1 (CI uses it through `npx`)

## Local setup

1. Copy `.env.example` to `.env.local` and provide the required values.
2. Start and rebuild the local database:

   ```bash
   npx --yes supabase@2.109.1 start
   npx --yes supabase@2.109.1 db reset
   ```

3. Read the local API URL, anon key, and service-role key from:

   ```bash
   npx --yes supabase@2.109.1 status
   ```

4. Start the application:

   ```bash
   npm install
   npm run dev
   ```

The app is available at `http://127.0.0.1:3000`.

## Environment variables

Required in production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only; never expose it to the browser
- `RATE_LIMIT_HASH_SECRET` — random value of at least 32 characters
- `CRON_SECRET` — random value of at least 32 characters
- `TELEGRAM_BOT_TOKEN` — server only; token for the approved private Telegram bot
- `TELEGRAM_CHAT_ID` — server only; numeric ID of the approved private Telegram chat
- `NEXT_PUBLIC_SITE_URL` - canonical HTTPS origin for metadata, robots, sitemap,
  and generated booking QR codes

Optional migration/maintenance settings:

- `LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL`
- `ORPHAN_SLIP_RETENTION_HOURS`
- `CUSTOMER_DATA_RETENTION_DAYS` - anonymizes completed/cancelled bookings in
  batches; allowed range is 365-3650 days and empty means disabled

## Database and storage

The repository is the schema source of truth. `supabase db reset` applies every
file in `supabase/migrations` and must succeed before a database change is
merged. Do not make untracked production schema changes in the Dashboard.

The migrations create two private buckets:

- `slips` for customer payment slips
- `site-config` for PromptPay QR and settings fallback

To provision an administrator:

1. Create the user through Supabase Auth.
2. Insert the Auth user UUID into `public.admin_users` with role `owner` or
   `admin` and `active = true`.
3. Keep public Auth signup disabled and require MFA in production.

The first successful admin password login continues to `/login/mfa`. Enroll a
TOTP authenticator and complete AAL2 verification before `/admin` can be used.

See [docs/security-hardening.md](docs/security-hardening.md) for the complete
security and rollout model.

Customers must acknowledge the versioned notice at `/privacy` before booking.
Keep `PRIVACY_NOTICE_VERSION` and the database insert trigger version aligned
whenever the notice changes.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npx --yes supabase@2.109.1 db lint --local --level warning --fail-on error
```

Database integration tests require a reachable local or staging Supabase:

```bash
RUN_SUPABASE_INTEGRATION=1 npm run test:integration
```

Browser smoke tests start the development server automatically:

```bash
RUN_E2E=1 npm run test:e2e
```

The local E2E server uses port 3100 and never reuses an unrelated process.

On PowerShell, set environment variables with `$env:NAME = "value"` before
running the command.

## Deployment

1. Back up the production database and confirm migration history is in sync.
2. Run `npx --yes supabase@2.109.1 migration list` against the linked project.
3. Apply pending migrations with `npx --yes supabase@2.109.1 db push`.
4. Apply Auth/config changes with `npx --yes supabase@2.109.1 config push`.
5. Configure all required Vercel environment variables.
6. Confirm the Vercel project uses Node.js 24.x, then deploy the application.
7. Enroll TOTP for every active admin and verify booking, lookup, admin, export,
   privacy, monitoring, and cron.
8. Send an explicit Telegram test delivery to the approved private chat. Replay
   with `npm run notify:replay -- NF-YYYYMMDD-NNNN` only when the booking is a
   known failed outbox row; never use replay as a general notification test.
9. Run security advisors and review `npm audit` before promotion.

The daily Vercel cron calls `/api/cron/maintenance`. Orphan-slip deletion and
customer-data retention are both opt-in and disabled until their environment
variables are explicitly configured.

## Backup and restore

- Use the encrypted scripts and operating procedure in
  [docs/backup-runbook.md](docs/backup-runbook.md).
- Schedule daily backups, keep the age identity separate, and perform a restore
  drill in an isolated Supabase project at least quarterly.
- Never use production customer data in automated tests.

## Automated dependency updates

Dependabot checks npm and GitHub Actions weekly. Keep branch protection enabled
so dependency updates cannot bypass CI or review.
