param(
  [Parameter(Mandatory = $true)]
  [string]$EncryptedBackup
)

$ErrorActionPreference = "Stop"
if (-not (Get-Command age -ErrorAction SilentlyContinue)) {
  throw "age is required to verify encrypted backups."
}
if (-not $env:BACKUP_AGE_IDENTITY_FILE) {
  throw "BACKUP_AGE_IDENTITY_FILE must point to the age private identity."
}

$resolvedBackup = [IO.Path]::GetFullPath($EncryptedBackup)
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
  throw "Backup file not found: $resolvedBackup"
}

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("nimman-restore-" + [guid]::NewGuid())
$zipPath = Join-Path $tempRoot "backup.zip"
$extractPath = Join-Path $tempRoot "extracted"
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null

try {
  age --decrypt -i $env:BACKUP_AGE_IDENTITY_FILE -o $zipPath $resolvedBackup
  if ($LASTEXITCODE -ne 0) { throw "Backup decryption failed" }
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath

  foreach ($required in @("schema.sql", "roles.sql", "data.sql", "manifest.json", "storage/storage-manifest.json")) {
    if (-not (Test-Path -LiteralPath (Join-Path $extractPath $required) -PathType Leaf)) {
      throw "Backup is incomplete: missing $required"
    }
  }

  $manifest = Get-Content -LiteralPath (Join-Path $extractPath "manifest.json") -Raw | ConvertFrom-Json
  foreach ($entry in $manifest) {
    $target = [IO.Path]::GetFullPath((Join-Path $extractPath $entry.path))
    if (-not $target.StartsWith("$extractPath$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
      throw "Unsafe path in manifest"
    }
    $actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $entry.sha256) { throw "Checksum mismatch: $($entry.path)" }
  }

  Write-Host "Backup verified: $($manifest.Count) files passed checksum validation."
}
finally {
  $checkedTemp = [IO.Path]::GetFullPath($tempRoot)
  $systemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if ($checkedTemp.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $checkedTemp)) {
    Remove-Item -LiteralPath $checkedTemp -Recurse -Force
  }
}
