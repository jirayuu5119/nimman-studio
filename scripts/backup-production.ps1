param(
  [Parameter(Mandatory = $true)]
  [string]$BackupRoot
)

$ErrorActionPreference = "Stop"

foreach ($name in @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BACKUP_AGE_RECIPIENT"
)) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Missing required environment variable: $name"
  }
}

if (-not (Get-Command age -ErrorAction SilentlyContinue)) {
  throw "age is required. Install age and configure BACKUP_AGE_RECIPIENT."
}

$resolvedRoot = [IO.Path]::GetFullPath($BackupRoot)
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ($resolvedRoot.StartsWith($projectRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "BackupRoot must be outside the project repository."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$staging = Join-Path $resolvedRoot "nimman-studio-$timestamp-staging"
$archive = Join-Path $resolvedRoot "nimman-studio-$timestamp.zip"
$encrypted = "$archive.age"
New-Item -ItemType Directory -Force -Path $staging | Out-Null

function Invoke-DatabaseDump {
  param(
    [string[]]$DumpFlags = @(),
    [Parameter(Mandatory = $true)]
    [string]$OutputFile
  )

  $arguments = @("--yes", "supabase@2.109.1", "db", "dump")
  if ($env:SUPABASE_DB_URL) {
    $arguments += @("--db-url", $env:SUPABASE_DB_URL)
  }
  else {
    $arguments += "--linked"
  }
  $arguments += $DumpFlags
  $arguments += @("--file", $OutputFile)
  & npx.cmd @arguments
  if ($LASTEXITCODE -ne 0) { throw "Database dump failed: $OutputFile" }
}

try {
  Invoke-DatabaseDump -DumpFlags @() -OutputFile (Join-Path $staging "schema.sql")
  Invoke-DatabaseDump -DumpFlags @("--role-only") -OutputFile (Join-Path $staging "roles.sql")
  Invoke-DatabaseDump -DumpFlags @("--data-only", "--use-copy") -OutputFile (Join-Path $staging "data.sql")

  node (Join-Path $PSScriptRoot "backup-storage.mjs") (Join-Path $staging "storage")
  if ($LASTEXITCODE -ne 0) { throw "Storage backup failed" }

  $hashes = Get-ChildItem -LiteralPath $staging -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($staging.Length).TrimStart(
      [char[]]@("\", "/")
    )
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    [pscustomobject]@{ path = $relative; sha256 = $hash.Hash.ToLowerInvariant(); bytes = $_.Length }
  }
  $hashes | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $staging "manifest.json") -Encoding utf8

  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $archive -CompressionLevel Optimal
  age -r $env:BACKUP_AGE_RECIPIENT -o $encrypted $archive
  if ($LASTEXITCODE -ne 0) { throw "Backup encryption failed" }

  $encryptedHash = Get-FileHash -LiteralPath $encrypted -Algorithm SHA256
  $encryptedHash.Hash.ToLowerInvariant() | Set-Content -LiteralPath "$encrypted.sha256" -Encoding ascii
  Write-Host "Encrypted backup created: $encrypted"
}
finally {
  $checkedStaging = [IO.Path]::GetFullPath($staging)
  if ($checkedStaging.StartsWith("$resolvedRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
    if (Test-Path -LiteralPath $checkedStaging) {
      Remove-Item -LiteralPath $checkedStaging -Recurse -Force
    }
  }
  if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
  }
}
