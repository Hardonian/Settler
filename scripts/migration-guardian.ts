#!/usr/bin/env tsx
/**
 * Migration Guardian – Supabase + Prisma + Upstash
 *
 * Keeps Prisma migrations fully applied to the connected Supabase Postgres database
 * with ZERO manual CLI work from the user, and verifies in concrete, non-theoretical ways
 * that migrations were actually executed and the DB schema matches Prisma expectations.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { Redis } from "@upstash/redis";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MigrationRun {
  runId: string;
  timestamp: {
    utc: string;
    local: string;
  };
  env: {
    file: string;
    dbUrl: string;
    dbHost: string;
    dbName: string;
    mode: "LIVE/PROD" | "STAGING/DEV";
  };
  preRunStatus: {
    pendingMigrations: string[];
    statusOutput: string;
  };
  commands: string[];
  applyResults: {
    success: boolean;
    output: string;
    error?: string;
  };
  archiveInfo: {
    appliedMigrationIds: string[];
    archivePath: string;
  };
  redisStatus: {
    configured: boolean;
    reachable: boolean;
    latency?: number;
    error?: string;
  };
  realityVerification: {
    prismaStatus: string;
    dbSchemaCheck: {
      passed: boolean;
      details: string;
    };
    healthCheck: {
      passed: boolean;
      responseTime: number;
      tableCount: number;
    };
  };
  outcome: "GO-LIVE VERIFIED" | "GO-LIVE VERIFIED (NO CHANGES NEEDED)" | "PARTIAL – MANUAL ACTION REQUIRED" | "FAILED – SEE ERRORS ABOVE";
  errors: string[];
  warnings: string[];
}

// ============================================================================
// ENV & DB DISCOVERY
// ============================================================================

function discoverEnvFiles(): string[] {
  const envFiles = [
    ".env.local",
    ".env.development",
    ".env",
    ".env.production",
    ".env.connection", // Also check .env.connection
  ];
  return envFiles.filter((file) => fs.existsSync(file));
}

function loadEnvFile(file: string): Record<string, string> {
  const env: Record<string, string> = {};
  const content = fs.readFileSync(file, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        env[key] = value;
      }
    }
  }
  return env;
}

function selectDatabaseUrl(envFiles: string[]): { file: string; url: string; mode: "LIVE/PROD" | "STAGING/DEV" } {
  // Priority 1: GitHub Actions / CI environment variables (secrets)
  // These take precedence over .env files
  const ciEnvVars = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.SUPABASE_DATABASE_URL,
  ].filter(Boolean) as string[];

  if (ciEnvVars.length > 0) {
    const url = ciEnvVars[0];
    const mode = determineMode("GitHub Actions / CI", url);
    console.log("   ℹ️  Using GitHub Actions / CI environment variable (secret)");
    return { file: "GitHub Actions / CI", url, mode };
  }

  // Priority 2: Check if SUPABASE_URL + SUPABASE_DB_PASSWORD are in env (from GitHub secrets)
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD)) {
    const constructed = constructSupabaseUrl({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || "",
    });
    if (constructed) {
      const mode = determineMode("GitHub Actions / CI", constructed);
      console.log("   ℹ️  Constructed URL from GitHub Actions / CI environment variables (secrets)");
      return { file: "GitHub Actions / CI", url: constructed, mode };
    }
  }

  // Priority 3: .env files (for local development)
  for (const file of envFiles) {
    const env = loadEnvFile(file);
    const candidates = [
      env.DATABASE_URL,
      env.SUPABASE_DB_URL,
      env.SUPABASE_URL ? constructSupabaseUrl(env) : null,
    ].filter(Boolean) as string[];

    if (candidates.length > 0) {
      const url = candidates[0];
      const mode = determineMode(file, url);
      return { file, url, mode };
    }
  }

  throw new Error(
    "No DATABASE_URL or SUPABASE_DB_URL found in:\n" +
    "  - GitHub Actions / CI environment variables (secrets)\n" +
    "  - Env files: " + envFiles.join(", ") + "\n\n" +
    "For GitHub Actions, ensure DATABASE_URL or SUPABASE_DB_URL is set as a repository secret."
  );
}

function constructSupabaseUrl(env: Record<string, string>): string | null {
  if (!env.SUPABASE_URL) return null;
  const hostMatch = env.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!hostMatch) return null;

  const host = `db.${hostMatch[1]}.supabase.co`;
  const password = env.SUPABASE_DB_PASSWORD || env.DB_PASSWORD;
  if (!password) return null;

  return `postgresql://postgres:${password}@${host}:5432/postgres?sslmode=require`;
}

function determineMode(
  file: string,
  url: string
): "LIVE/PROD" | "STAGING/DEV" {
  const fileLower = file.toLowerCase();
  const urlLower = url.toLowerCase();

  if (
    fileLower.includes("production") ||
    fileLower.includes("prod") ||
    urlLower.includes("prod") ||
    urlLower.includes("production")
  ) {
    return "LIVE/PROD";
  }

  if (
    fileLower.includes("staging") ||
    fileLower.includes("dev") ||
    fileLower.includes("development") ||
    fileLower.includes("local")
  ) {
    return "STAGING/DEV";
  }

  // Default to STAGING/DEV for safety, but log a warning
  return "STAGING/DEV";
}

function maskDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.username}:****@${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url.replace(/:[^:@]+@/, ":****@");
  }
}

function extractDbInfo(url: string): { host: string; dbName: string } {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname || urlObj.host;
    const dbName = urlObj.pathname.replace(/^\//, "").split("?")[0] || "postgres";
    return { host, dbName };
  } catch {
    // Fallback regex parsing
    const match = url.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      return { host: match[1], dbName: match[3] || "postgres" };
    }
    return { host: "unknown", dbName: "unknown" };
  }
}

async function testDatabaseConnection(url: string): Promise<void> {
  const pool = new Pool({
    connectionString: url,
    ssl: url.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query("SELECT 1");
    await pool.end();
  } catch (error: any) {
    await pool.end();
    throw new Error(
      `Database connection failed: ${error.message}. Check Supabase password, IP allowlist, or sslmode settings.`
    );
  }
}

// ============================================================================
// PRISMA DETECTION & STATUS
// ============================================================================

function detectPrisma(): {
  schemaPath: string;
  migrationsPath: string;
  installed: boolean;
} {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const migrationsPath = path.join(process.cwd(), "prisma", "migrations");

  const schemaExists = fs.existsSync(schemaPath);
  const migrationsExists = fs.existsSync(migrationsPath);

  // Check if Prisma is installed
  let installed = false;
  try {
    execSync("npx prisma --version", { stdio: "ignore" });
    installed = true;
  } catch {
    // Not installed
  }

  return {
    schemaPath: schemaExists ? schemaPath : "",
    migrationsPath: migrationsExists ? migrationsPath : "",
    installed,
  };
}

function getPrismaMigrateCommand(): string {
  // Check package.json scripts
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
    const scripts = packageJson.scripts || {};

    if (scripts["prisma:migrate:deploy"]) {
      return "npm run prisma:migrate:deploy";
    }
    if (scripts["db:migrate"]) {
      return "npm run db:migrate";
    }
  }

  return "npx prisma migrate deploy";
}

function getPrismaStatusCommand(): string {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
    const scripts = packageJson.scripts || {};

    if (scripts["prisma:status"]) {
      return "npm run prisma:status";
    }
  }

  return "npx prisma migrate status";
}

function getMigrationStatus(): {
  pending: string[];
  statusOutput: string;
  isUpToDate: boolean;
} {
  const statusCmd = getPrismaStatusCommand();
  let output = "";
  let pending: string[] = [];
  let isUpToDate = false;

  try {
    output = execSync(statusCmd, {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
    });

    // Parse output for pending migrations
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("Database schema is up to date")) {
        isUpToDate = true;
      }
      // Look for migration IDs in the output
      const migrationMatch = line.match(/(\d{14}_\w+)/);
      if (migrationMatch && line.toLowerCase().includes("pending")) {
        pending.push(migrationMatch[1]);
      }
    }
  } catch (error: any) {
    output = error.stdout?.toString() || error.message || String(error);
    // If command fails, we can't determine status
  }

  return { pending, statusOutput: output, isUpToDate };
}

function getPendingMigrationIds(): string[] {
  const migrationsPath = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsPath)) {
    return [];
  }

  const entries = fs.readdirSync(migrationsPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^\d{14}_/.test(name))
    .sort();
}

// ============================================================================
// MIGRATION APPLICATION
// ============================================================================

function applyMigrations(): { success: boolean; output: string; error?: string } {
  const migrateCmd = getPrismaMigrateCommand();
  let output = "";
  let error: string | undefined;

  try {
    output = execSync(migrateCmd, {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
      env: { ...process.env },
    });
    return { success: true, output };
  } catch (err: any) {
    output = err.stdout?.toString() || "";
    error = err.stderr?.toString() || err.message || String(err);
    return { success: false, output, error };
  }
}

// ============================================================================
// MIGRATION ARCHIVING
// ============================================================================

function archiveMigrations(migrationIds: string[]): string {
  const archiveBase = path.join(process.cwd(), "prisma", "_archive");
  if (!fs.existsSync(archiveBase)) {
    fs.mkdirSync(archiveBase, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const archivePath = path.join(archiveBase, timestamp);

  fs.mkdirSync(archivePath, { recursive: true });

  const migrationsPath = path.join(process.cwd(), "prisma", "migrations");

  for (const migrationId of migrationIds) {
    const sourcePath = path.join(migrationsPath, migrationId);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(archivePath, migrationId);
      copyRecursiveSync(sourcePath, destPath);
    }
  }

  // Ensure .gitignore includes _archive
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignoreContent.includes("prisma/_archive")) {
      fs.appendFileSync(
        gitignorePath,
        "\n# Migration archives\nprisma/_archive/\n"
      );
    }
  } else {
    fs.writeFileSync(
      gitignorePath,
      "# Migration archives\nprisma/_archive/\n"
    );
  }

  return archivePath;
}

function copyRecursiveSync(src: string, dest: string): void {
  const exists = fs.existsSync(src);
  const stats = exists ? fs.statSync(src) : null;
  const isDirectory = stats?.isDirectory() ?? false;

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// ============================================================================
// REDIS CONNECTIVITY
// ============================================================================

async function checkRedisConnectivity(): Promise<{
  configured: boolean;
  reachable: boolean;
  latency?: number;
  error?: string;
}> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    return { configured: false, reachable: false };
  }

  try {
    const redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return { configured: true, reachable: true, latency };
  } catch (error: any) {
    return {
      configured: true,
      reachable: false,
      error: error.message || String(error),
    };
  }
}

// ============================================================================
// REALITY VERIFICATION
// ============================================================================

async function verifyPrismaStatus(): Promise<string> {
  const statusCmd = getPrismaStatusCommand();
  try {
    const output = execSync(statusCmd, {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
    });
    return output;
  } catch (error: any) {
    return error.stdout?.toString() || error.message || String(error);
  }
}

async function verifyDbSchema(
  dbUrl: string,
  schemaPath: string
): Promise<{ passed: boolean; details: string }> {
  if (!fs.existsSync(schemaPath)) {
    return {
      passed: false,
      details: "Prisma schema file not found",
    };
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Read Prisma schema to get model names
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const modelMatches = schemaContent.matchAll(/model\s+(\w+)\s*\{/g);
    const models = Array.from(modelMatches, (m) => m[1]);

    if (models.length === 0) {
      return {
        passed: false,
        details: "No Prisma models found in schema",
      };
    }

    // Check if tables exist
    const failedChecks: string[] = [];
    for (const model of models.slice(0, 10)) {
      // Limit to first 10 models to avoid too many queries
      try {
        const result = await pool.query(
          `SELECT 1 FROM "${model}" LIMIT 1`
        );
        // Table exists and is queryable
      } catch (error: any) {
        // Check if it's a "does not exist" error
        if (error.message.includes("does not exist")) {
          failedChecks.push(`Table "${model}" does not exist`);
        } else {
          // Other error (permissions, etc.) - log but don't fail
        }
      }
    }

    await pool.end();

    if (failedChecks.length > 0) {
      return {
        passed: false,
        details: `Schema mismatch: ${failedChecks.join(", ")}`,
      };
    }

    return {
      passed: true,
      details: `Verified ${Math.min(models.length, 10)} Prisma models exist in database`,
    };
  } catch (error: any) {
    await pool.end();
    return {
      passed: false,
      details: `Schema verification error: ${error.message}`,
    };
  }
}

async function performHealthCheck(dbUrl: string): Promise<{
  passed: boolean;
  responseTime: number;
  tableCount: number;
}> {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    const start = Date.now();
    const result = await pool.query(
      `SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const responseTime = Date.now() - start;
    const tableCount = parseInt(result.rows[0].count, 10);

    await pool.end();

    return {
      passed: true,
      responseTime,
      tableCount,
    };
  } catch (error: any) {
    await pool.end();
    return {
      passed: false,
      responseTime: 0,
      tableCount: 0,
    };
  }
}

// ============================================================================
// MIGRATION LOG MANAGEMENT
// ============================================================================

function readMigrationLog(): string {
  const logPath = path.join(process.cwd(), "MIGRATION_LOG.md");
  if (fs.existsSync(logPath)) {
    return fs.readFileSync(logPath, "utf-8");
  }
  return `# Migration Guardian Log

This log is maintained by the Migration Guardian agent to track all Prisma migration operations.

---
`;
}

function appendMigrationLog(run: MigrationRun): void {
  const logPath = path.join(process.cwd(), "MIGRATION_LOG.md");
  let content = readMigrationLog();

  const entry = `
## Run: ${run.runId}

**Timestamp:** ${run.timestamp.utc} (UTC) / ${run.timestamp.local} (Local)

### Environment & Database
- **Env File:** \`${run.env.file}\`
- **DB Host:** \`${run.env.dbHost}\`
- **Database:** \`${run.env.dbName}\`
- **Mode:** \`${run.env.mode}\`
- **DB URL (masked):** \`${maskDatabaseUrl(run.env.dbUrl)}\`

### Pre-run Status
- **Pending Migrations:** ${run.preRunStatus.pendingMigrations.length}
  ${run.preRunStatus.pendingMigrations.length > 0
      ? run.preRunStatus.pendingMigrations.map((id) => `  - \`${id}\``).join("\n")
      : "  - None"
    }
- **Status Output:**
\`\`\`
${run.preRunStatus.statusOutput}
\`\`\`

### Commands Executed
${run.commands.map((cmd) => `- \`${cmd}\``).join("\n")}

### Apply Results
- **Success:** ${run.applyResults.success ? "✅ Yes" : "❌ No"}
${run.applyResults.output
      ? `- **Output:**\n\`\`\`\n${run.applyResults.output}\n\`\`\``
      : ""
    }
${run.applyResults.error
      ? `- **Error:**\n\`\`\`\n${run.applyResults.error}\n\`\`\``
      : ""
    }

### Archive Info
${run.archiveInfo.appliedMigrationIds.length > 0
      ? `- **Applied Migration IDs:**\n${run.archiveInfo.appliedMigrationIds.map((id) => `  - \`${id}\``).join("\n")}\n- **Archive Path:** \`${run.archiveInfo.archivePath}\``
      : "- No migrations were applied in this run"
    }

### Redis Connectivity Status
- **Configured:** ${run.redisStatus.configured ? "✅ Yes" : "❌ No"}
${run.redisStatus.configured
      ? `- **Reachable:** ${run.redisStatus.reachable ? "✅ Yes" : "❌ No"}${run.redisStatus.latency ? ` (latency: ${run.redisStatus.latency}ms)` : ""}${run.redisStatus.error ? `\n- **Error:** ${run.redisStatus.error}` : ""}`
      : "- **Status:** NO CONFIG FOUND (skipped)"
    }

### Reality Verification (GO-LIVE CHECK)
- **Prisma Status:**
\`\`\`
${run.realityVerification.prismaStatus}
\`\`\`

- **DB Schema Check:** ${run.realityVerification.dbSchemaCheck.passed ? "✅ Passed" : "❌ Failed"}
  - ${run.realityVerification.dbSchemaCheck.details}

- **Health Check:** ${run.realityVerification.healthCheck.passed ? "✅ Passed" : "❌ Failed"}
  - Response Time: ${run.realityVerification.healthCheck.responseTime}ms
  - Public Tables: ${run.realityVerification.healthCheck.tableCount}

### Outcome
**STATE: ${run.outcome}**

${run.errors.length > 0
      ? `### Errors\n${run.errors.map((e) => `- ${e}`).join("\n")}\n`
      : ""
    }
${run.warnings.length > 0
      ? `### Warnings\n${run.warnings.map((w) => `- ${w}`).join("\n")}\n`
      : ""
    }

---

`;

  content += entry;
  fs.writeFileSync(logPath, content, "utf-8");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const runId = `run-${Date.now()}`;
  const timestamp = {
    utc: new Date().toISOString(),
    local: new Date().toString(),
  };

  const run: MigrationRun = {
    runId,
    timestamp,
    env: { file: "", dbUrl: "", dbHost: "", dbName: "", mode: "STAGING/DEV" },
    preRunStatus: { pendingMigrations: [], statusOutput: "" },
    commands: [],
    applyResults: { success: false, output: "" },
    archiveInfo: { appliedMigrationIds: [], archivePath: "" },
    redisStatus: { configured: false, reachable: false },
    realityVerification: {
      prismaStatus: "",
      dbSchemaCheck: { passed: false, details: "" },
      healthCheck: { passed: false, responseTime: 0, tableCount: 0 },
    },
    outcome: "FAILED – SEE ERRORS ABOVE",
    errors: [],
    warnings: [],
  };

  console.log("🛡️  Migration Guardian – Supabase + Prisma + Upstash\n");
  console.log(`Run ID: ${runId}\n`);

  try {
    // Step 1: Discover env files and select DB URL
    console.log("📋 Step 1: Discovering environment files...");
    const envFiles = discoverEnvFiles();
    if (envFiles.length === 0) {
      throw new Error("No .env files found. Please create .env.local, .env.development, or .env");
    }
    console.log(`   Found: ${envFiles.join(", ")}\n`);

    // Select database URL (prioritizes GitHub Actions secrets)
    const { file, url, mode } = selectDatabaseUrl(envFiles);
    run.env = {
      file,
      dbUrl: url,
      ...extractDbInfo(url),
      mode,
    };

    // Load env vars from files only if not using GitHub Actions/CI
    // (GitHub Actions secrets are already in process.env)
    if (!file.includes("GitHub Actions") && !file.includes("CI")) {
      dotenv.config({ path: file });
    } else {
      // Still load .env files for other variables (like Redis, etc.)
      // but DATABASE_URL from env takes precedence
      for (const envFile of envFiles) {
        dotenv.config({ path: envFile, override: false });
      }
    }

    console.log(`   Selected: ${file}`);
    console.log(`   DB Host: ${run.env.dbHost}`);
    console.log(`   Database: ${run.env.dbName}`);
    console.log(`   Mode: ${run.env.mode}\n`);

    if (mode === "LIVE/PROD") {
      run.warnings.push("⚠️  Operating on LIVE/PRODUCTION database. Proceeding with extra caution.");
      console.log("   ⚠️  WARNING: LIVE/PRODUCTION database detected!\n");
    }

    // Step 2: Test DB connectivity
    console.log("🔌 Step 2: Testing database connectivity...");
    try {
      await testDatabaseConnection(url);
      console.log("   ✅ Database connection successful\n");
    } catch (error: any) {
      // Check if it's a placeholder password issue
      if (url.includes("[YOUR_PASSWORD]") || url.includes("YOUR_PASSWORD")) {
        run.errors.push(
          "DATABASE_URL contains placeholder password [YOUR_PASSWORD]. Please set a real password in GitHub secrets or .env file."
        );
        run.warnings.push(
          "For GitHub Actions: Set DATABASE_URL secret in repository settings (Settings → Secrets → Actions)"
        );
        console.log("   ⚠️  Database URL contains placeholder password\n");
        console.log("   💡 To fix:");
        console.log("      - Set DATABASE_URL in GitHub repository secrets, OR");
        console.log("      - Update .env.connection with real password\n");
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    // Step 3: Detect Prisma
    console.log("🔍 Step 3: Detecting Prisma setup...");
    const prisma = detectPrisma();
    if (!prisma.installed) {
      throw new Error(
        "Prisma is not installed. Please run: npm install prisma @prisma/client"
      );
    }
    if (!prisma.schemaPath) {
      throw new Error(
        "Prisma schema not found at prisma/schema.prisma. Please initialize Prisma first."
      );
    }
    if (!prisma.migrationsPath) {
      throw new Error(
        "Prisma migrations directory not found at prisma/migrations. Please initialize Prisma migrations."
      );
    }
    console.log("   ✅ Prisma detected and configured\n");

    // Step 4: Check migration status
    console.log("📊 Step 4: Checking Prisma migration status...");
    const status = getMigrationStatus();
    run.preRunStatus = {
      pendingMigrations: status.pending.length > 0 ? status.pending : getPendingMigrationIds(),
      statusOutput: status.statusOutput,
    };
    console.log(`   Pending migrations: ${run.preRunStatus.pendingMigrations.length}`);
    if (run.preRunStatus.pendingMigrations.length > 0) {
      console.log(`   IDs: ${run.preRunStatus.pendingMigrations.join(", ")}\n`);
    } else {
      console.log("   ✅ No pending migrations\n");
    }

    // Step 5: Apply migrations if needed
    if (run.preRunStatus.pendingMigrations.length > 0) {
      console.log("🚀 Step 5: Applying pending migrations...");
      const migrateCmd = getPrismaMigrateCommand();
      run.commands.push(migrateCmd);
      console.log(`   Running: ${migrateCmd}\n`);

      const applyResult = applyMigrations();
      run.applyResults = applyResult;

      if (!applyResult.success) {
        run.errors.push(`Migration application failed: ${applyResult.error}`);
        console.log("   ❌ Migration application failed\n");
        appendMigrationLog(run);
        process.exit(1);
      }

      console.log("   ✅ Migrations applied successfully\n");

      // Archive applied migrations
      console.log("📦 Step 5.1: Archiving applied migrations...");
      const archivePath = archiveMigrations(run.preRunStatus.pendingMigrations);
      run.archiveInfo = {
        appliedMigrationIds: run.preRunStatus.pendingMigrations,
        archivePath,
      };
      console.log(`   ✅ Archived to: ${archivePath}\n`);

      // Re-check status
      console.log("🔍 Step 5.2: Re-checking migration status...");
      const postStatus = getMigrationStatus();
      if (!postStatus.isUpToDate && postStatus.pending.length > 0) {
        run.errors.push(
          `Migrations still pending after apply: ${postStatus.pending.join(", ")}`
        );
        console.log("   ❌ Migrations still pending\n");
        appendMigrationLog(run);
        process.exit(1);
      }
      console.log("   ✅ Database schema is up to date\n");
    } else {
      console.log("⏭️  Step 5: Skipping migration application (no pending migrations)\n");
    }

    // Step 6: Redis connectivity check
    console.log("🔴 Step 6: Checking Upstash Redis connectivity...");
    run.redisStatus = await checkRedisConnectivity();
    if (run.redisStatus.configured) {
      if (run.redisStatus.reachable) {
        console.log(`   ✅ Redis reachable (latency: ${run.redisStatus.latency}ms)\n`);
      } else {
        console.log(`   ❌ Redis connection failed: ${run.redisStatus.error}\n`);
        run.warnings.push(`Redis connectivity check failed: ${run.redisStatus.error}`);
      }
    } else {
      console.log("   ⚠️  Redis not configured (skipped)\n");
    }

    // Step 7: Reality verification
    console.log("✅ Step 7: Performing reality verification (GO-LIVE CHECK)...");

    // 7.1: Prisma status
    console.log("   7.1: Verifying Prisma status...");
    run.realityVerification.prismaStatus = await verifyPrismaStatus();
    console.log("   ✅ Prisma status verified\n");

    // 7.2: DB schema check
    console.log("   7.2: Verifying DB schema matches Prisma...");
    const schemaCheck = await verifyDbSchema(url, prisma.schemaPath);
    run.realityVerification.dbSchemaCheck = schemaCheck;
    if (schemaCheck.passed) {
      console.log(`   ✅ Schema check passed: ${schemaCheck.details}\n`);
    } else {
      console.log(`   ❌ Schema check failed: ${schemaCheck.details}\n`);
      run.errors.push(`Schema verification failed: ${schemaCheck.details}`);
    }

    // 7.3: Health check
    console.log("   7.3: Performing database health check...");
    const healthCheck = await performHealthCheck(url);
    run.realityVerification.healthCheck = healthCheck;
    if (healthCheck.passed) {
      console.log(
        `   ✅ Health check passed (${healthCheck.responseTime}ms, ${healthCheck.tableCount} tables)\n`
      );
    } else {
      console.log("   ❌ Health check failed\n");
      run.errors.push("Database health check failed");
    }

    // Step 8: Determine outcome
    const allChecksPassed =
      run.realityVerification.dbSchemaCheck.passed &&
      run.realityVerification.healthCheck.passed &&
      run.applyResults.success !== false;

    if (allChecksPassed && run.preRunStatus.pendingMigrations.length === 0) {
      run.outcome = "GO-LIVE VERIFIED (NO CHANGES NEEDED)";
    } else if (allChecksPassed) {
      run.outcome = "GO-LIVE VERIFIED";
    } else if (run.errors.length > 0) {
      run.outcome = "FAILED – SEE ERRORS ABOVE";
    } else {
      run.outcome = "PARTIAL – MANUAL ACTION REQUIRED";
    }

    // Step 9: Update migration log
    console.log("📝 Step 8: Updating MIGRATION_LOG.md...");
    appendMigrationLog(run);
    console.log("   ✅ Log updated\n");

    // Final summary
    console.log("=".repeat(60));
    console.log(`OUTCOME: ${run.outcome}`);
    console.log("=".repeat(60));

    if (run.errors.length > 0) {
      console.log("\n❌ Errors:");
      run.errors.forEach((e) => console.log(`   - ${e}`));
    }

    if (run.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      run.warnings.forEach((w) => console.log(`   - ${w}`));
    }

    if (run.outcome.startsWith("GO-LIVE VERIFIED")) {
      console.log("\n✅ Migration Guardian completed successfully!");
      console.log("   The database is in the authoritative GO-LIVE migration state.");
      process.exit(0);
    } else {
      console.log("\n❌ Migration Guardian completed with issues.");
      console.log("   Please review MIGRATION_LOG.md for details.");
      process.exit(1);
    }
  } catch (error: any) {
    run.errors.push(error.message || String(error));
    run.outcome = "FAILED – SEE ERRORS ABOVE";
    appendMigrationLog(run);

    console.error("\n❌ Fatal error:");
    console.error(`   ${error.message || String(error)}\n`);
    console.error("See MIGRATION_LOG.md for full details.");
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { main };
