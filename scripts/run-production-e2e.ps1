param(
  [int]$WebPort = 3100,
  [int]$ApiPort = 4100
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$artifactDir = Join-Path $repoRoot "artifacts"
New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null

foreach ($port in @($WebPort, $ApiPort)) {
  if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
    throw "Port $port is already in use"
  }
}

$pnpm = (Get-Command pnpm.cmd).Source
$apiOut = Join-Path $artifactDir "e2e-api.out.log"
$apiErr = Join-Path $artifactDir "e2e-api.err.log"
$webOut = Join-Path $artifactDir "e2e-web.out.log"
$webErr = Join-Path $artifactDir "e2e-web.err.log"

$testEnvironment = @{
  NODE_ENV = "test"
  DATABASE_URL = "postgresql://postgres:password@localhost:5433/settler_test"
  DB_HOST = "localhost"
  DB_PORT = "5433"
  DB_NAME = "settler_test"
  DB_USER = "postgres"
  DB_PASSWORD = "password"
  REDIS_URL = "redis://localhost:6380"
  JWT_SECRET = "test-secret-min-32-chars-long-for-testing"
  ENCRYPTION_KEY = "12345678901234567890123456789012"
  SUPABASE_URL = "http://localhost:54321"
  SUPABASE_ANON_KEY = "test-anon-key-for-e2e"
  SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-for-e2e"
}

function Stop-ProcessTree([int]$ProcessId) {
  Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-ProcessTree $_.ProcessId }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

$composeFile = Join-Path $repoRoot "packages/api/docker-compose.test.yml"
$composeArguments = @("compose", "-p", "settler-e2e", "-f", $composeFile)
$api = $null
$web = $null
$infrastructureStarted = $false
$previousEnvironment = @{}
foreach ($name in $testEnvironment.Keys) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
}

try {
  docker info --format "{{.ServerVersion}}" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker is required for the isolated E2E PostgreSQL and Redis services"
  }

  & docker @composeArguments up -d postgres-test redis-test
  if ($LASTEXITCODE -ne 0) { throw "Failed to start isolated E2E infrastructure" }
  $infrastructureStarted = $true

  $databaseReady = $false
  for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $client.Connect("localhost", 5433)
      $client.Dispose()
      $databaseReady = $true
      break
    } catch {
      if ($client) { $client.Dispose() }
    }
    Start-Sleep -Seconds 1
  }
  if (-not $databaseReady) { throw "E2E PostgreSQL failed readiness" }

  foreach ($name in $testEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($name, $testEnvironment[$name], "Process")
  }
  $previousPort = $env:PORT
  $env:PORT = "$ApiPort"
  $api = Start-Process -FilePath $pnpm `
    -ArgumentList @("--filter", "@settler/api", "start") `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $apiOut `
    -RedirectStandardError $apiErr `
    -PassThru `
    -WindowStyle Hidden
  $env:PORT = $previousPort

  $web = Start-Process -FilePath $pnpm `
    -ArgumentList @("--filter", "@settler/web", "exec", "next", "start", "-p", "$WebPort") `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $webOut `
    -RedirectStandardError $webErr `
    -PassThru `
    -WindowStyle Hidden
  foreach ($name in $testEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], "Process")
  }

  $webReady = $false
  $apiReady = $false
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    if ($api.HasExited -or $web.HasExited) {
      break
    }
    if (-not $webReady) {
      try {
        $response = Invoke-WebRequest -UseBasicParsing "http://localhost:$WebPort/verify" -TimeoutSec 3
        $webReady = $response.StatusCode -eq 200
      } catch {}
    }
    if (-not $apiReady) {
      try {
        $response = Invoke-WebRequest -UseBasicParsing "http://localhost:$ApiPort/health" -TimeoutSec 3
        $apiReady = $response.StatusCode -eq 200
      } catch {}
    }
    if ($webReady -and $apiReady) { break }
    Start-Sleep -Seconds 1
  }

  Write-Output "WEB_READY=$webReady API_READY=$apiReady"
  if (-not ($webReady -and $apiReady)) {
    Write-Output "--- API STDERR ---"
    Get-Content $apiErr -Tail 80 -ErrorAction SilentlyContinue
    Write-Output "--- WEB STDERR ---"
    Get-Content $webErr -Tail 80 -ErrorAction SilentlyContinue
    throw "E2E servers failed readiness"
  }

  $env:E2E_BASE_URL = "http://localhost:$WebPort"
  $env:API_URL = "http://localhost:$ApiPort"
  & $pnpm exec playwright test tests/e2e/ci-critical.spec.ts --project=ci-critical
  if ($LASTEXITCODE -ne 0) { throw "Playwright failed with exit code $LASTEXITCODE" }

  Write-Output "--- API LOG TAIL ---"
  Get-Content $apiOut -Tail 30 -ErrorAction SilentlyContinue
  Write-Output "--- WEB ERROR TAIL ---"
  Get-Content $webErr -Tail 30 -ErrorAction SilentlyContinue
} finally {
  foreach ($name in $testEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], "Process")
  }
  if ($web) { Stop-ProcessTree $web.Id }
  if ($api) { Stop-ProcessTree $api.Id }
  if ($infrastructureStarted) { & docker @composeArguments down }
}
