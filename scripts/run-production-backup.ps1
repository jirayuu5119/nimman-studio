param(
  [string]$BackupRoot = "D:\NimmanFoto-Encrypted-Backups",
  [string]$RecipientFile = "$env:USERPROFILE\.nimman-studio-backup\age-recipient.txt"
)

$ErrorActionPreference = "Stop"
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$envFile = Join-Path $projectRoot ".env.local"
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
  throw "Missing local production environment file: $envFile"
}

foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    $name = $matches[1]
    $value = $matches[2].Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

if (-not (Test-Path -LiteralPath $RecipientFile -PathType Leaf)) {
  throw "Missing age recipient file: $RecipientFile"
}
$env:BACKUP_AGE_RECIPIENT = (Get-Content -LiteralPath $RecipientFile -Raw).Trim()

& (Join-Path $PSScriptRoot "backup-production.ps1") -BackupRoot $BackupRoot
if ($LASTEXITCODE -ne 0) { throw "Production backup failed" }
