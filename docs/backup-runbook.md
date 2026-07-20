# Production backup and restore runbook

Customer records and payment slips must never be stored unencrypted in Git,
cloud-sync folders, or GitHub Actions artifacts.

## Prerequisites

- Node.js 24 and the project dependencies installed.
- `age` installed, with the private identity stored separately from the backup.
- `BACKUP_AGE_IDENTITY_FILE` set only on the restore workstation.
- A linked Supabase CLI session, or `SUPABASE_DB_URL` when the backup runs on a
  machine without a linked project.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available only to
  the backup operator.
- `BACKUP_AGE_RECIPIENT` set to the public age recipient.
- A backup root outside this repository, ideally on encrypted storage that is
  replicated off site.

## Create an encrypted backup

```powershell
.\scripts\backup-production.ps1 -BackupRoot "E:\NimmanFoto-Encrypted-Backups"
```

The script dumps roles, schema, data, the private `slips` bucket, and the
`site-config` bucket. It creates a SHA-256 manifest, encrypts the complete ZIP
with age, and removes plaintext staging files.

## Verify a backup

```powershell
.\scripts\verify-backup.ps1 -EncryptedBackup "E:\NimmanFoto-Encrypted-Backups\nimman-studio-YYYYMMDD-HHMMSS.zip.age"
```

Verification decrypts into a unique temporary directory, checks required
artifacts and every file hash, then removes the temporary plaintext copy.

## Verified Windows operator locations

The production workstation keeps encrypted archives under
`D:\NimmanFoto-Encrypted-Backups` and a recovery identity copy under
`F:\NimmanFoto-Backup-Key`. D: and F: were verified as separate physical
disks on 2026-07-20. The identity path used by restore verification is:

```powershell
$env:BACKUP_AGE_IDENTITY_FILE = "F:\NimmanFoto-Backup-Key\age-identity.txt"
```

On 2026-07-20, `nimman-studio-20260720-130033.zip.age` passed archive
SHA-256 validation and all 49 internal manifest checks. Its SHA-256 is
`a819566692205f26000b122dee8bcf08a78133044d3e9514b1c35879a6a048fc`.

## Schedule and retention

- Run the backup daily after the maintenance cron.
- Keep at least 7 daily, 4 weekly, and 12 monthly encrypted copies.
- Keep one encrypted copy in a physically or logically separate location.
- Alert when no successful encrypted backup has been produced for 26 hours.
- Never delete the last known-good backup.

## Restore drill

At least quarterly, create a separate non-production Supabase project and:

1. Verify and decrypt one backup on an encrypted workstation.
2. Restore roles, schema, and data in that order.
3. Upload storage objects to buckets with public access disabled.
4. Run migration history checks, database advisors, integration tests, and a
   non-notifying browser smoke test.
5. Record the date, operator, backup timestamp, result, and recovery duration.
6. Destroy the drill project and all decrypted temporary files.

Do not run restore drills against production and do not use a production
Discord webhook in the drill environment.
