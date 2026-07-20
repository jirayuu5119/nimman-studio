# Production Readiness Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Nimman Studio for sustained production use, release the verified revision, and preserve a tested rollback path.

**Architecture:** Implement pure configuration and path helpers first so retention and cookie behavior can be tested without server dependencies. Apply least-privilege database changes through one replayable Supabase migration, then change hosted configuration in a fail-closed order before merging and deploying the exact verified commit.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Playwright, Supabase CLI/Postgres/Auth/Storage, Vercel CLI, GitHub Actions, PowerShell, age encryption.

## Global Constraints

- Production URL is `https://grad.jirayufoto.net`.
- Customer retention is 365 days for completed or cancelled bookings.
- Orphan-slip grace is 720 hours and remains disabled until a read-only reconciliation has zero ambiguous references.
- Preview must not receive Production service-role or operational secrets.
- No live storage object is deleted during initial rollout verification.
- No plaintext backup is deleted before checksum and restore verification with the age identity stored separately.
- No real Production booking is created by verification.
- The protected GitHub `verify` check must pass before merge and Production deployment.

---

### Task 1: Portable Supabase Auth Cookie Smoke Test

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `getSupabaseAuthCookiePrefix(supabaseUrl: string): string | null` from `lib/auth/session-recovery.ts`.
- Produces: an E2E cookie-cleanup request that works for local and hosted Supabase project refs.

- [x] **Step 1: Confirm the existing Production regression**

Run `$env:RUN_E2E='1'; $env:E2E_BASE_URL='https://grad.jirayufoto.net'; npm.cmd run test:e2e -- --grep "stale local Auth cookies"`.

Expected: FAIL because the request sends `sb-127-auth-token.0` while Production clears only its configured Supabase project cookie.

- [x] **Step 2: Replace the hard-coded cookie prefix**

Add the helper import and derive the cookie from `NEXT_PUBLIC_SUPABASE_URL`:

```ts
import { getSupabaseAuthCookiePrefix } from "@/lib/auth/session-recovery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
const authCookiePrefix = getSupabaseAuthCookiePrefix(supabaseUrl);
if (!authCookiePrefix) throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL");
```

Send `${authCookiePrefix}.0=stale-session` and assert that exact dynamic prefix is cleared while the unrelated cookie is untouched.

- [x] **Step 3: Verify GREEN**

Run the Step 1 command again. Expected: 1 passed, 0 failed.

- [x] **Step 4: Commit**

Run `git add -- tests/e2e/smoke.spec.ts` and `git commit -m "test: make auth cookie smoke portable"`.

### Task 2: Fail-Closed Retention Configuration

**Files:**
- Create: `lib/retention.ts`
- Modify: `lib/privacy.ts`
- Modify: `lib/maintenance.ts`
- Modify: `tests/unit/production-controls.test.ts`

**Interfaces:**
- Produces: `parseOrphanSlipRetentionHours(value: unknown): number | null`.
- Produces: `ORPHAN_SLIP_RETENTION_HOURS = 720` and `CUSTOMER_DATA_RETENTION_DAYS = 365` policy constants.
- Consumes: `parseCustomerDataRetentionDays(value: unknown): number | null` without changing its 365-3650 safety range.

- [x] **Step 1: Write failing policy tests**

```ts
expect(CUSTOMER_DATA_RETENTION_DAYS).toBe(365);
expect(ORPHAN_SLIP_RETENTION_HOURS).toBe(720);
expect(parseOrphanSlipRetentionHours("720")).toBe(720);
expect(parseOrphanSlipRetentionHours("23")).toBeNull();
expect(parseOrphanSlipRetentionHours("8761")).toBeNull();
expect(parseOrphanSlipRetentionHours("720.5")).toBeNull();
expect(parseOrphanSlipRetentionHours(720)).toBeNull();
```

- [x] **Step 2: Verify RED**

Run `npm.cmd test -- tests/unit/production-controls.test.ts`. Expected: FAIL because `@/lib/retention` does not exist.

- [x] **Step 3: Implement the pure retention helper**

```ts
export const CUSTOMER_DATA_RETENTION_DAYS = 365;
export const ORPHAN_SLIP_RETENTION_HOURS = 720;
export const MIN_ORPHAN_SLIP_RETENTION_HOURS = 24;
export const MAX_ORPHAN_SLIP_RETENTION_HOURS = 24 * 365;

export function parseOrphanSlipRetentionHours(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const hours = Number(value);
  return Number.isInteger(hours) &&
    hours >= MIN_ORPHAN_SLIP_RETENTION_HOURS &&
    hours <= MAX_ORPHAN_SLIP_RETENTION_HOURS
    ? hours
    : null;
}
```

Import the helper in `lib/maintenance.ts`, replace its private numeric parsing, and multiply the parsed integer by `60 * 60 * 1000`. Export the 365-day policy through `lib/privacy.ts` so visible wording and hosted configuration use one value.

- [x] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: all tests in `production-controls.test.ts` pass.

- [x] **Step 5: Commit**

Stage the four files explicitly and commit with `feat: validate retention configuration`.

### Task 3: Accurate Privacy Notice and Safe Cleanup Refactor

**Files:**
- Create: `lib/slip-path.ts`
- Modify: `lib/maintenance.ts`
- Modify: `lib/privacy.ts`
- Modify: `app/privacy/page.tsx`
- Modify: `tests/unit/production-controls.test.ts`
- Delete after reference verification: `lib/middleware.ts`
- Delete after reference verification: `lib/server.ts`
- Modify: `lib/bookingAccessToken.ts`

**Interfaces:**
- Produces: `getLegacySlipPath(slipUrl: string | null): string | null`.
- Produces: privacy notice version `2026-07-20` and visible 365-day retention disclosure.

- [x] **Step 1: Write failing path and notice-version tests**

```ts
expect(getLegacySlipPath("https://x.supabase.co/storage/v1/object/public/slips/a%2Fb.jpg")).toBe("a/b.jpg");
expect(getLegacySlipPath("https://x.supabase.co/storage/v1/object/sign/slips/a.jpg")).toBeNull();
expect(getLegacySlipPath("https://x.supabase.co/storage/v1/object/public/slips/../a.jpg")).toBeNull();
expect(getLegacySlipPath("not-a-url")).toBeNull();
expect(PRIVACY_NOTICE_VERSION).toBe("2026-07-20");
```

- [x] **Step 2: Verify RED**

Run the Task 2 test command. Expected: FAIL because the helper is missing and the notice version is `2026-07-18`.

- [x] **Step 3: Implement the helper and notice**

Move the existing legacy URL parser into `lib/slip-path.ts` as `getLegacySlipPath`, import it from `lib/maintenance.ts`, and retain fail-closed behavior for any non-empty legacy URL that cannot be normalized. Set `PRIVACY_NOTICE_VERSION` to `2026-07-20`. Update the Thai retention section to state that completed or cancelled booking personal data and payment slips are anonymized or removed after 365 days, while encrypted disaster-recovery copies may overlap briefly before scheduled expiry.

- [x] **Step 4: Remove proven-dead duplication**

Run `rg -n 'lib/middleware|@/lib/middleware|lib/server|@/lib/server|createSupabaseServerClient' -g '!lib/middleware.ts' -g '!lib/server.ts' -g '!docs/**' -g '!node_modules/**' -g '!.next/**'`. Expected: no references. Delete `lib/middleware.ts` and `lib/server.ts`, then reduce `lib/bookingAccessToken.ts` to one `import "server-only";` declaration.

- [x] **Step 5: Verify GREEN and static safety**

Run `npm.cmd test -- tests/unit/production-controls.test.ts` and `npm.cmd run typecheck`. Expected: both exit 0.

- [x] **Step 6: Commit**

Stage only the listed files and commit with `feat: document and enforce retention safety`.

### Task 4: Least-Privilege Supabase Migration

**Files:**
- Create with CLI: `supabase/migrations/*_harden_trigger_function_privileges.sql`

**Interfaces:**
- Produces: revoked direct execution on `public.set_updated_at()` for `PUBLIC`, `anon`, and `authenticated`.
- Produces: removal of `pg_net` only when remote dependency inspection returns no external dependents.

- [x] **Step 1: Verify CLI and current guidance**

Run `npx.cmd supabase --version`, `npx.cmd supabase migration new --help`, and `npx.cmd supabase db --help`. Fetch the current Supabase changelog and official Auth password-security documentation before changing hosted settings.

- [x] **Step 2: Inspect remote dependencies and grants read-only**

Query `pg_extension`, `pg_depend`, `pg_proc`, and `information_schema.routine_privileges` for `pg_net` and `public.set_updated_at()` through the linked project. Record object names and grantees only.

- [x] **Step 3: Create the migration**

Run `npx.cmd supabase migration new harden_trigger_function_privileges` and write:

```sql
revoke execute on function public.set_updated_at()
  from public, anon, authenticated;
```

Append `drop extension if exists pg_net;` only when Step 2 proves zero external dependents.

- [x] **Step 4: Replay locally**

Run `npx.cmd supabase db reset`, `npx.cmd supabase migration list --local`, `npx.cmd supabase db lint --local --level warning`, and `npm.cmd run test:integration`. Expected: reset/replay succeeds, lint reports no errors, and integration tests pass.

- [x] **Step 5: Commit**

Stage the generated migration and commit with `fix: restrict trigger function execution`.

### Task 5: Read-Only Production Storage Reconciliation

**Files:**
- No repository files changed.

**Interfaces:**
- Consumes: authorized Production Supabase configuration.
- Produces: counts for referenced, unreferenced, older-than-720-hour, and ambiguous legacy objects.

- [ ] **Step 1: Run reconciliation without deletion**

Use a temporary Node script outside the repository or a read-only tool call to page through `bookings.slip_path`, `bookings.slip_url`, and the private `slips` bucket. Apply `getLegacySlipPath` semantics. Do not call `storage.remove`, UPDATE, DELETE, or a mutating RPC.

Expected fields are `database_rows`, `storage_objects`, `referenced_objects`, `ambiguous_references`, and `orphan_candidates_older_than_720h`, each with an integer value.

- [ ] **Step 2: Gate cleanup**

Proceed with the 720-hour environment value only if `ambiguous_references=0`; otherwise leave cleanup disabled and record the stage as safely blocked.

### Task 6: Hosted Configuration Isolation

**Files:**
- No repository files changed.

**Interfaces:**
- Produces: Production-only secret scopes, explicit retention, and leaked-password protection when the linked Supabase plan supports it.

- [ ] **Step 1: Capture names and scopes without values**

Run `npx.cmd vercel env ls` and inspect `.vercel/project.json`. Record names and environments only.

- [ ] **Step 2: Remove Production credentials from Preview**

Use `npx.cmd vercel env rm NAME preview --yes` for `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RATE_LIMIT_HASH_SECRET`, `OPERATIONAL_ALERT_WEBHOOK_URL`, `LEGACY_BOOKING_TOKEN_ACCEPT_UNTIL`, `DISCORD_WEBHOOK_URL`, and any other server secret shared with Preview. Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` from Preview until an isolated staging backend and URL exist. Remove Telegram variables from all scopes only after `rg -n 'TELEGRAM_'` confirms no code references. Keep Production values intact.

- [ ] **Step 3: Set explicit Production retention**

Pipe `365` to `npx.cmd vercel env add CUSTOMER_DATA_RETENTION_DAYS production --yes`. After Task 5 passes its gate, pipe `720` to `npx.cmd vercel env add ORPHAN_SLIP_RETENTION_HOURS production --yes`.

- [ ] **Step 4: Enable leaked-password protection**

Use the current supported Supabase Auth setting or Management API. If unavailable on the plan, make no simulated application change and record the limitation.

- [ ] **Step 5: Verify hosted settings**

Re-list Vercel scopes and inspect Supabase Auth configuration. Expected: no Production service-role credential in Preview and explicit results for both retention and leaked-password protection.

- [ ] **Step 6: Configure custom SMTP only with real credentials**

Inspect authorized local and hosted configuration for SMTP variable names without printing values. If a complete existing provider configuration is found, set Supabase Auth SMTP through the supported hosted configuration and send one controlled recovery message to the configured administrator. If no credentials exist, keep recovery enabled with the current Supabase sender and record custom SMTP as an external provider dependency; do not create credentials, purchase a service, or commit a secret.

### Task 7: Encrypt and Restore-Verify the Backup

**Files:**
- Optionally modify: `docs/backup-runbook.md` if verified Windows paths differ.
- Source: `D:\Project\production-backups\nimman-studio-20260712-1208`
- Encrypted target: `D:\NimmanFoto-Encrypted-Backups`
- Recovery identity target: `F:\NimmanFoto-Backup-Key`

**Interfaces:**
- Produces: an age-encrypted archive, SHA-256 checksum, verified restore, and separately stored identity.

- [ ] **Step 1: Inspect exact paths**

Resolve each absolute path and verify source file count/bytes, free space, and that F: is writable without moving or deleting source files.

- [ ] **Step 2: Install and verify age**

Use an official age release, verify its published checksum, and run `age --version` plus `age-keygen --version`.

- [ ] **Step 3: Generate identity and encrypt**

Create the identity under F:, keep only its public recipient with operator configuration, create a SHA-256 source manifest, compress the backup, and encrypt it under D: outside the repository.

- [ ] **Step 4: Restore-verify byte-for-byte**

Decrypt to a unique temporary directory and compare relative paths, counts, sizes, and SHA-256 hashes. Expected: zero missing, extra, or mismatched files.

- [ ] **Step 5: Gate plaintext removal**

Remove the temporary restore copy. Remove the source backup only when F: is readable, the encrypted checksum is recorded, and restore comparison has zero mismatches; otherwise preserve it and report the unmet condition.

### Task 8: Verification, PR, Migration, and Release

**Files:**
- Modify: this plan's checkboxes as execution evidence accumulates.

**Interfaces:**
- Produces: merged verified commit, applied linked migration, and READY Production deployment.

- [ ] **Step 1: Run fresh local verification**

Run lint, typecheck, unit tests, coverage, production build, high-severity dependency audit, Supabase reset, integration tests, local database lint, and `git diff --check main...HEAD`. Every command must exit 0.

- [ ] **Step 2: Review scope and secrets**

Inspect status, full diff, diff stat, and a targeted secret-pattern scan. Expected: approved files only and no credential value.

- [ ] **Step 3: Push and open PR**

Verify `gh --version` and `gh auth status`, push with upstream tracking, and open a ready pull request to `main` describing the security, retention, database, and operational changes.

- [ ] **Step 4: Wait for protected CI and merge**

Merge only after the required `verify` workflow succeeds. Record the merge commit SHA.

- [ ] **Step 5: Apply the linked migration**

Push migrations with the discovered Supabase CLI command. Verify remote migration history, routine grants, database lint, and security advisors. Never reset Production.

- [ ] **Step 6: Deploy the exact merge commit**

Record the current Production deployment URL as the rollback target. Use Vercel Git integration or `vercel deploy --prod` from merged `main`. Inspect until `READY` and confirm the production alias. If post-deploy authentication, access-control, or public-route checks regress, promote the recorded deployment without restoring Production secrets to Preview.

- [ ] **Step 7: Run Production-safe post-deploy checks**

Run the safe smoke suite, production verification script, header checks, anonymous booking-boundary query, unauthorized cron request, and deployment error-log scan. Do not create a Production booking or invoke authorized maintenance.

- [ ] **Step 8: Final handoff**

Report branch, PR, merge commit, migration, deployment, test counts, environment scopes, backup checksum/restore, reconciliation counts, and explicit external limitations such as absent custom SMTP credentials or plan-restricted leaked-password protection.
