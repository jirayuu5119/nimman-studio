# Production Readiness Hardening Design

**Date:** 2026-07-20
**Project:** Nimman Studio
**Selected approach:** Security-first staged rollout
**Target:** Production at `https://grad.jirayufoto.net`

## 1. Purpose

Prepare the current application for sustained production use without weakening the working production service. The rollout will harden secret isolation, database permissions, backup handling, retention behavior, authentication configuration, automated tests, and deployment verification.

The work must preserve the existing booking and administrator flows. No destructive production operation is allowed unless its prerequisites and recovery path have been verified first.

## 2. Current baseline

The audited revision is `aa8eedb42d63fc3676bffde754da520fc854c15b` on `main`.

At the start of this design:

- Lint, TypeScript checks, unit tests, coverage thresholds, production build, and dependency audit pass locally.
- The exact revision passed the complete GitHub Actions workflow, including local Supabase reset, integration tests, and browser tests.
- The production site, security headers, Supabase authentication endpoint, privacy columns, and anonymous booking access boundary are healthy.
- Local and remote Supabase migrations are aligned.
- Production and Preview currently share sensitive Vercel environment variables, including the Supabase service-role key.
- Supabase reports `pg_net` installed in the `public` schema and leaked-password protection disabled.
- The `set_updated_at()` function can currently be executed by `PUBLIC`, `anon`, and `authenticated`.
- A plaintext production backup exists under `D:\Project\production-backups\nimman-studio-20260712-1208`.
- No verified custom SMTP credentials or `age` backup-encryption identity are available in the project configuration.
- The external browser smoke test contains a hard-coded local Supabase cookie prefix.

## 3. Desired end state

The rollout is complete when all applicable items below are true:

1. Production secrets are scoped only to Production. Preview cannot access the production service-role key, cron secret, alert webhook, legacy admin token, or other production-only credentials.
2. Preview deployments are either connected to an isolated non-production backend or prevented from exercising privileged server behavior. This project will use the latter until a separate staging Supabase project is deliberately provisioned.
3. Database trigger functions have least-privilege execution grants, and `pg_net` is removed only when dependency inspection proves that it is unused outside the extension itself.
4. Leaked-password protection is enabled through a supported Supabase setting when the linked project and plan permit it.
5. Retention settings are explicit: completed or cancelled customer records use a 365-day operational retention period, and unreferenced uploaded slips use a 720-hour (30-day) grace period.
6. Orphan cleanup is enabled only after a dry run demonstrates that stored paths and database references reconcile safely.
7. The privacy notice accurately describes retention and operational handling.
8. The browser test derives the Supabase cookie name from configuration rather than a local-project constant.
9. Dead server helper files and duplicate server-only markers are removed only after reference checks prove they are unused.
10. The plaintext backup is removed only after an encrypted archive, checksum, decryption test, and separately stored recovery identity have all been verified.
11. The branch passes all local and CI checks, is merged through the protected branch workflow, deploys to Production, and passes post-deployment smoke checks.

## 4. Rollout stages

### Stage A: Code and test hardening

The implementation will begin with failing or newly targeted tests before changing behavior.

- Replace the hard-coded `sb-127-auth-token` expectation in `tests/e2e/smoke.spec.ts` with a cookie name derived from `NEXT_PUBLIC_SUPABASE_URL`, using the application's existing Supabase cookie naming logic where possible.
- Add or extend unit coverage for cookie-name derivation and retention-related configuration validation.
- Add configuration validation for positive integer retention values. Invalid values must fail closed or fall back to a documented safe value rather than trigger immediate deletion.
- Update the privacy notice to state the 365-day retention policy for completed or cancelled booking/customer records and explain that encrypted backups follow the same operational deletion schedule subject to short disaster-recovery overlap.
- Remove `lib/middleware.ts` and `lib/server.ts` only if repository-wide reference checks show no imports, runtime loading, or configuration references.
- Consolidate repeated `import "server-only"` declarations in `lib/bookingAccessToken.ts` without changing behavior.

### Stage B: Database migration and authentication hardening

A new timestamped Supabase migration will be created using the Supabase CLI and tested from a clean local database reset.

The migration will:

- Revoke `EXECUTE` on `set_updated_at()` from `PUBLIC`, `anon`, and `authenticated`.
- Grant only the privileges required by the function owner and database maintenance roles. Normal trigger execution does not require callers to hold direct function execution rights.
- Inspect dependencies before changing `pg_net`. If no application object depends on it, remove the extension. If a dependency exists, leave it installed, document the dependent object, and do not attempt a destructive move or drop.
- Avoid modifying booking data or changing existing row-level security behavior.

Leaked-password protection will be enabled through the supported Supabase Auth configuration or Management API after the current official capability is confirmed. If the linked Supabase plan does not expose the setting, the deployment will proceed with the existing 12-character password policy and MFA, and the unmet external control will be reported explicitly rather than simulated in application code.

### Stage C: Vercel environment isolation

Environment changes will be applied before the new production deployment:

- Keep production Supabase URL, anon key, and service-role key scoped to Production only.
- Remove the service-role key, cron secret, operational webhook, legacy admin token, Discord webhook, and any other production credentials from Preview.
- Keep `NEXT_PUBLIC_SITE_URL` production-scoped unless an isolated preview URL is explicitly configured.
- Remove unused Telegram environment variables after confirming there are no code references.
- Set `CUSTOMER_DATA_RETENTION_DAYS=365` for Production.
- Set `ORPHAN_SLIP_RETENTION_HOURS=720` for Production only after the storage-reference dry run passes.
- Preserve existing production values during scope changes; values must be exported or recorded by name and checksum, never printed into logs or committed.

Because no staging Supabase project is currently authorized or provisioned, Preview builds must not receive production credentials. A separate staging backend is a future enhancement and is outside this rollout.

### Stage D: Storage cleanup safety check

Before enabling orphan deletion, a read-only reconciliation will compare database slip references with storage objects.

- Normalize stored object paths using the same parsing logic as the cleanup endpoint.
- Count referenced objects, unreferenced objects, ambiguous legacy URLs, and objects older than 720 hours.
- Do not delete during the dry run.
- Enable the retention variable only when the ambiguous count is zero and a sample of candidate objects has been manually inspected through metadata or signed URLs.
- The existing cleanup limit of 100 objects per run remains in place.
- If reconciliation is ambiguous, leave cleanup disabled and report the blocker without deleting any storage object.

### Stage E: Encrypted backup conversion

The plaintext backup will be treated as production-sensitive material.

The conversion procedure is fail-closed:

1. Install or use the official `age` binary from a verified source.
2. Generate a dedicated age identity and recipient.
3. Store the encrypted archive on the D: volume outside the repository and store the recovery identity on a separate writable volume, provisionally F:.
4. Create SHA-256 checksums for the source manifest and encrypted archive.
5. Decrypt into a temporary directory and compare the restored file count, paths, sizes, and SQL/image checksums with the source.
6. Remove the temporary decrypted verification copy.
7. Remove the original plaintext backup only if all prior checks pass and the recovery identity is readable from the separate location.

If F: is unavailable, not writable, or cannot reasonably serve as a separate recovery location, the plaintext source will not be deleted. The encrypted archive may still be created, but the unresolved key-storage requirement will be reported.

No encryption key, recipient secret, database dump, or image backup may be committed to Git.

### Stage F: Custom SMTP

Custom SMTP requires an externally issued provider account and credentials. No provider will be purchased and no credentials will be invented.

- Search existing authorized configuration for usable SMTP credentials without exposing their values.
- If credentials exist, configure Supabase Auth SMTP, send a controlled recovery email, and verify delivery.
- If credentials do not exist, retain the current recovery behavior and report custom SMTP as an external go-live follow-up requiring the owner's provider choice and credentials.
- Do not commit SMTP credentials or disable account recovery merely to silence the configuration warning.

This external dependency does not block deployment of the code and database hardening because administrator access already uses MFA and the existing authentication path is healthy, but it remains an explicitly disclosed operational risk.

### Stage G: CI, merge, and production deployment

All work remains on `codex/production-readiness-hardening` until verification succeeds.

Required pre-merge checks:

- ESLint
- TypeScript typecheck
- unit tests
- coverage thresholds
- production build
- dependency audit
- Supabase local reset and migration replay
- database lint
- integration tests
- browser tests
- a review of the exact diff and secret scan

The branch will be committed in coherent, reviewable units, pushed, and opened as a pull request. The protected `verify` check must pass before merge. Production deployment will follow the merge through the repository's established Vercel integration or an explicit production deployment if automatic deployment is not configured.

No direct mutation of `main`, force push, branch-protection bypass, or deployment of a failing revision is permitted.

## 5. Post-deployment verification

Verification must use fresh command output and the deployed production revision.

- Confirm the Vercel deployment is `READY`, assigned to `grad.jirayufoto.net`, and built from the intended commit.
- Verify the home page and key public routes on desktop and mobile viewport sizes.
- Verify CSP, HSTS, frame, content-type, referrer, and permissions-policy headers.
- Verify the Supabase Auth health endpoint and that anonymous access to booking records remains denied.
- Verify the administrator route redirects or challenges unauthenticated users correctly.
- Run the production-safe browser smoke suite without creating a real booking or deleting real data.
- Confirm Production environment scopes and confirm Preview does not contain the production service-role key.
- Confirm the new migration appears in the linked project and database lint remains clean.
- Re-run Supabase security advisors and record any remaining plan-dependent or intentionally accepted warning.
- Confirm cron/retention endpoints reject unauthorized requests.
- Observe deployment and function logs for a bounded post-deploy interval for new server errors.

## 6. Rollback strategy

Application rollback uses the immediately preceding known-good Vercel production deployment.

Environment changes will be recorded by variable name and scope so Production values can be restored without exposing secret values. Production secrets will not be restored to Preview during rollback.

The database migration is intentionally low risk:

- Revoked direct execution grants can be restored with an explicit follow-up migration if an unexpected dependency is found.
- `pg_net` will only be removed when dependency inspection proves it unused; if later required, a controlled migration can reinstall the same supported extension version.
- No production booking rows, storage objects, or user accounts are altered by the migration.

Orphan cleanup remains disabled until reconciliation succeeds. Backup plaintext deletion occurs only after independent restore verification, so the encrypted archive and recovery identity form the recovery path.

## 7. Stop conditions

The rollout must pause before the affected stage if any of the following occurs:

- A test or build fails for a reason not understood.
- The migration changes data or policies beyond the reviewed scope.
- Preview isolation would remove a value required by Production.
- Storage reconciliation produces ambiguous paths or unexpected candidate counts.
- Backup encryption cannot be restored byte-for-byte or its identity is not stored separately.
- The production deployment points at a commit other than the verified merge commit.
- Post-deployment checks show authentication, booking access control, or public routes regressed.

Pausing one stage does not authorize bypassing its safety condition. The previous production deployment remains the fallback.

## 8. Explicit exclusions and follow-ups

- Provisioning or paying for a new SMTP provider is not authorized by this technical rollout; credentials must come from an owner-approved provider.
- Provisioning a separate paid Supabase staging project is not included. Preview remains isolated from Production until one exists.
- This rollout does not create test bookings in Production and does not exercise destructive cleanup against live customer data.
- Legal review of privacy wording is outside the engineering scope; the implementation will make the operational policy accurate and plain-language.

## 9. Acceptance criteria

The implementation may be reported as deployed when:

- All code, tests, migrations, and environment-scope changes described above have either passed or are explicitly reported as an external dependency.
- GitHub CI passes on the merged commit.
- Production serves that commit and passes all safe smoke and security-boundary checks.
- No production secret is available to Preview.
- No plaintext backup is deleted without a verified encrypted restore and separately stored identity.
- No live storage object is deleted by the initial orphan-retention rollout.
- Remaining limitations, including SMTP or Supabase plan restrictions, are included in the final handoff.
