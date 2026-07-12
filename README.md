# Nimman Foto Booking

Production booking system for Nimman Foto, built with Next.js 16, Supabase,
private payment-slip storage, an admin dashboard, and Discord notifications.

## Requirements

- Node.js 20.9 or newer
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
- `DISCORD_WEBHOOK_URL`

Optional migration/maintenance settings:

- `LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL`
- `ORPHAN_SLIP_RETENTION_HOURS`

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

See [docs/security-hardening.md](docs/security-hardening.md) for the complete
security and rollout model.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
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
6. Deploy the application and verify booking, lookup, admin, export, and cron.
7. Run security advisors and review `npm audit` before promotion.

The daily Vercel cron calls `/api/cron/maintenance`. Orphan-slip deletion is
disabled unless `ORPHAN_SLIP_RETENTION_HOURS` is explicitly configured.

## Backup and restore

- Back up the database and both private buckets before schema or storage work.
- Test restore procedures in a separate Supabase project.
- Restore schema/migrations first, then storage objects, then application
  environment values.
- Never use production customer data in automated tests.
