param(
  [string]$Version = $env:SETTLER_VERSION,
  [string]$InstallDir = $env:SETTLER_INSTALL_DIR
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($Version)) { $Version = "latest" }
if ([string]::IsNullOrWhiteSpace($InstallDir)) { $InstallDir = Join-Path $HOME ".settler\bin" }

$repo = "settler/settler"
$arch = if ($env:PROCESSOR_ARCHITECTURE -match "ARM64") { "arm64" } else { "x64" }
$os = "windows"

if ($Version -eq "latest") {
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest"
  $tag = $release.tag_name
} else {
  $tag = $Version
}

if (-not $tag) { throw "Could not resolve release tag." }

$asset = "settler-$($tag.TrimStart('v'))-$os-$arch.zip"
$checksumAsset = "$asset.sha256"
$base = "https://github.com/$repo/releases/download/$tag"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("settler-install-" + [guid]::NewGuid().ToString("N"))
New-Item -Path $tempDir -ItemType Directory | Out-Null

try {
  $assetPath = Join-Path $tempDir $asset
  $checksumPath = Join-Path $tempDir $checksumAsset

  Invoke-WebRequest -Uri "$base/$asset" -OutFile $assetPath
  Invoke-WebRequest -Uri "$base/$checksumAsset" -OutFile $checksumPath

  $expected = (Get-Content $checksumPath).Split(" ")[0].Trim()
  $actual = (Get-FileHash $assetPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($expected.ToLowerInvariant() -ne $actual) {
    throw "Checksum verification failed for $asset"
  }

  Expand-Archive -Path $assetPath -DestinationPath $tempDir -Force
  New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
  Copy-Item -Path (Join-Path $tempDir "settler.cmd") -Destination (Join-Path $InstallDir "settler.cmd") -Force
  Copy-Item -Path (Join-Path $tempDir "settler.ps1") -Destination (Join-Path $InstallDir "settler.ps1") -Force
  Copy-Item -Path (Join-Path $tempDir "dist") -Destination (Join-Path $InstallDir "dist") -Recurse -Force

  Write-Host "Installed settler to $InstallDir"
  Write-Host "Add to PATH if needed: $InstallDir"
  & (Join-Path $InstallDir "settler.cmd") version
}
finally {
  Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
