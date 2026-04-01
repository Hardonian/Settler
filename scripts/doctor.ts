#!/usr/bin/env tsx
/**
 * Settler Doctor Script
 *
 * Comprehensive local environment health check:
 * - Toolchain (Node, pnpm, Docker, Git)
 * - Environment variables (required and optional)
 * - Service connectivity (Postgres, Redis, TigerBeetle)
 * - Database health (Prisma, migrations, seed status)
 * - Workspace integrity
 *
 * Usage:
 *   pnpm run doctor              # Human-readable output
 *   pnpm run doctor -- --json   # Machine-readable JSON output
 *   pnpm run doctor -- --fast   # Skip slow checks (build, migrations)
 *   pnpm run doctor -- --first-run  # First-run optimization
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more failures (blocking)
 *   2 - Warnings only (non-blocking)
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import { parseArgs } from "util";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "pass" | "warn" | "fail";
type Category = "toolchain" | "environment" | "services" | "database" | "workspace";

interface Check {
  category: Category;
  name: string;
  status: CheckStatus;
  message: string;
  remediation?: string;
}

interface DoctorResult {
  status: "pass" | "warn" | "fail";
  timestamp: string;
  summary: {
    passed: number;
    warnings: number;
    failures: number;
    total: number;
  };
  checks: Check[];
}

// ---------------------------------------------------------------------------
// CLI Args
// ---------------------------------------------------------------------------

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--");

const { values: args } = parseArgs({
  args: forwardedArgs,
  options: {
    json: { type: "boolean", default: false },
    fast: { type: "boolean", default: false },
    "first-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  strict: false,
});

const JSON_OUTPUT = Boolean(args.json);
const FAST_MODE = Boolean(args.fast);
const FIRST_RUN = Boolean(args["first-run"]);

if (args.help) {
  console.log(`
Settler Doctor - Local Environment Health Check

Usage:
  pnpm run doctor              # Human-readable output
  pnpm run doctor -- --json    # Machine-readable JSON
  pnpm run doctor -- --fast   # Skip slow checks
  pnpm run doctor -- --first-run  # First-run optimization
  pnpm run doctor -- --help   # Show this help

Exit codes:
  0 - All checks passed
  1 - One or more failures (blocking)
  2 - Warnings only (non-blocking)
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const results: Check[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addCheck(
  category: Category,
  name: string,
  status: CheckStatus,
  message: string,
  remediation?: string
) {
  results.push({ category, name, status, message, remediation });
}

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

function hasEnvVar(name: string): boolean {
  const val = process.env[name];
  return Boolean(val && val.trim().length > 0);
}

function parseArgs$1(command: string): string {
  const res = spawnSync(command, ["--version"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return res.status === 0 ? res.stdout.trim().split("\n")[0] : "not found";
}

async function checkPort(host: string, port: number, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function execCommand(
  command: string,
  args: string[] = [],
  options: { silent?: boolean; timeout?: number } = {}
): { success: boolean; output: string } {
  try {
    const output = execSync(`${command} ${args.join(" ")}`, {
      encoding: "utf-8",
      stdio: options.silent ? "pipe" : "inherit",
      timeout: options.timeout || 30000,
    });
    return { success: true, output: output.trim() };
  } catch (error: any) {
    return { success: false, output: error.message || String(error) };
  }
}

// ---------------------------------------------------------------------------
// Toolchain Checks
// ---------------------------------------------------------------------------

function checkNodeVersion() {
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.slice(1).split(".")[0]);

  // Read required version from .nvmrc
  const requiredVersion = readFile(".nvmrc") || "24.0.0";
  const requiredMajor = parseInt(requiredVersion.split(".")[0]);

  if (majorVersion >= requiredMajor) {
    addCheck("toolchain", "Node.js", "pass", `${currentVersion} (required: >=${requiredMajor}.x)`);
  } else {
    addCheck(
      "toolchain",
      "Node.js",
      "fail",
      `${currentVersion} (required: >=${requiredMajor}.x)`,
      `Run 'nvm install ${requiredVersion}' or 'nvm use' to switch Node versions`
    );
  }
}

function checkPnpmVersion() {
  try {
    const output = execSync("pnpm --version", { encoding: "utf-8", stdio: "pipe" });
    const version = output.trim();
    const major = parseInt(version.split(".")[0]);

    if (major >= 10) {
      addCheck("toolchain", "pnpm", "pass", `v${version} (required: >=10.x)`);
    } else {
      addCheck(
        "toolchain",
        "pnpm",
        "fail",
        `v${version} (required: >=10.x)`,
        "Upgrade pnpm: npm install -g pnpm@latest"
      );
    }
  } catch {
    addCheck("toolchain", "pnpm", "fail", "Not found", "Install pnpm: npm install -g pnpm");
  }
}

function checkDocker() {
  try {
    const output = execSync("docker --version", { encoding: "utf-8", stdio: "pipe" });
    addCheck("toolchain", "Docker", "pass", output.trim());
  } catch {
    addCheck(
      "toolchain",
      "Docker",
      "fail",
      "Not available or not running",
      "Install Docker Desktop and ensure the daemon is running"
    );
  }
}

function checkDockerCompose() {
  try {
    const output = execSync("docker-compose --version", { encoding: "utf-8", stdio: "pipe" });
    addCheck("toolchain", "Docker Compose", "pass", output.trim().split("\n")[0]);
  } catch {
    // Try docker compose (newer syntax)
    try {
      const output = execSync("docker compose version", { encoding: "utf-8", stdio: "pipe" });
      addCheck("toolchain", "Docker Compose", "pass", output.trim());
    } catch {
      addCheck(
        "toolchain",
        "Docker Compose",
        "warn",
        "Not found",
        "Install Docker Compose or use Docker Desktop which includes it"
      );
    }
  }
}

function checkGit() {
  try {
    const output = execSync("git --version", { encoding: "utf-8", stdio: "pipe" });
    addCheck("toolchain", "Git", "pass", output.trim());
  } catch {
    addCheck("toolchain", "Git", "fail", "Not found", "Install Git: https://git-scm.com/");
  }
}

// ---------------------------------------------------------------------------
// Environment Variable Checks
// ---------------------------------------------------------------------------

function checkRequiredEnvVars() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  const missing: string[] = [];

  for (const varName of required) {
    if (!hasEnvVar(varName)) {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    addCheck("environment", "Required Env Vars", "pass", "All required variables present");
  } else {
    addCheck(
      "environment",
      "Required Env Vars",
      "fail",
      `Missing: ${missing.join(", ")}`,
      `Copy .env.local.example to .env.local and configure required variables`
    );
  }
}

function checkDatabaseEnvVars() {
  const hasDatabaseUrl = hasEnvVar("DATABASE_URL");
  const hasDbHost = hasEnvVar("DB_HOST") && hasEnvVar("DB_PORT");
  const hasSupabaseDb = hasEnvVar("SUPABASE_DATABASE_URL") || hasEnvVar("DIRECT_URL");

  if (hasDatabaseUrl || hasDbHost || hasSupabaseDb) {
    addCheck("environment", "Database Config", "pass", "Database connection configured");
  } else {
    addCheck(
      "environment",
      "Database Config",
      "fail",
      "No database configuration found",
      "Set DATABASE_URL or DB_HOST/DB_PORT in your .env.local"
    );
  }
}

function checkOptionalEnvVars() {
  const optional = [
    { varName: "STRIPE_SECRET_KEY", name: "Stripe (billing)" },
    { varName: "RESEND_API_KEY", name: "Resend (email)" },
    { varName: "REDIS_URL", name: "Redis (caching)" },
    { varName: "SUPABASE_SERVICE_ROLE_KEY", name: "Supabase (service role)" },
  ];

  const missing: string[] = [];

  for (const { varName, name } of optional) {
    if (!hasEnvVar(varName)) {
      missing.push(name);
    }
  }

  if (missing.length === 0) {
    addCheck("environment", "Optional Services", "pass", "All optional services configured");
  } else {
    addCheck(
      "environment",
      "Optional Services",
      "warn",
      `Not configured: ${missing.join(", ")}`,
      "These services are optional - the app will work with reduced functionality"
    );
  }
}

// ---------------------------------------------------------------------------
// Service Connectivity Checks
// ---------------------------------------------------------------------------

async function checkPostgres() {
  const port = parseInt(getEnvVar("DB_PORT") || "5432");
  const host = getEnvVar("DB_HOST") || "localhost";

  const isReachable = await checkPort(host, port);

  if (isReachable) {
    addCheck("services", "PostgreSQL", "pass", `${host}:${port} is reachable`);
  } else {
    addCheck(
      "services",
      "PostgreSQL",
      "fail",
      `${host}:${port} is not reachable`,
      'Run "pnpm tb:start" to start local PostgreSQL, or check DB_HOST/DB_PORT in .env.local'
    );
  }
}

async function checkRedis() {
  const port = parseInt(getEnvVar("REDIS_PORT") || "6379");
  const host = getEnvVar("REDIS_HOST") || "localhost";

  const isReachable = await checkPort(host, port);

  if (isReachable) {
    addCheck("services", "Redis", "pass", `${host}:${port} is reachable`);
  } else {
    addCheck(
      "services",
      "Redis",
      "warn",
      `${host}:${port} is not reachable`,
      'Run "pnpm tb:start" to start local Redis, or set REDIS_URL for cloud Redis'
    );
  }
}

async function checkTigerBeetle() {
  const port = 4300;
  const host = "localhost";

  // Check if TigerBeetle is configured
  if (!hasEnvVar("TIGERBEETLE_ADDRESS") && !hasEnvVar("TB_ADDRESS")) {
    addCheck(
      "services",
      "TigerBeetle",
      "warn",
      "Not configured (optional for development)",
      'TigerBeetle is optional for local dev - run "pnpm tb:start" if needed'
    );
    return;
  }

  const isReachable = await checkPort(host, port);

  if (isReachable) {
    addCheck("services", "TigerBeetle", "pass", `${host}:${port} is reachable`);
  } else {
    addCheck(
      "services",
      "TigerBeetle",
      "warn",
      `${host}:${port} is not reachable`,
      'Run "pnpm tb:start" to start TigerBeetle for financial ledger features'
    );
  }
}

async function checkWebPort() {
  const port = parseInt(getEnvVar("PORT") || getEnvVar("NEXT_PORT") || "3000");
  const host = getEnvVar("HOST") || "localhost";

  const isReachable = await checkPort(host, port, 1000);

  if (isReachable) {
    addCheck("services", "Web Server", "pass", `${host}:${port} is already running`);
  } else {
    addCheck(
      "services",
      "Web Server",
      "warn",
      `${host}:${port} is not running (expected for dev server)`,
      'Start with "pnpm dev" to run the development server'
    );
  }
}

// ---------------------------------------------------------------------------
// Database Health Checks
// ---------------------------------------------------------------------------

function checkNodeModules() {
  const nodeModulesPath = path.join(process.cwd(), "node_modules");

  if (fileExists(nodeModulesPath)) {
    addCheck("workspace", "node_modules", "pass", "Dependencies installed");
  } else {
    addCheck(
      "workspace",
      "node_modules",
      "fail",
      "node_modules not found",
      'Run "pnpm install" to install dependencies'
    );
  }
}

function checkPnpmLockfile() {
  const lockPath = path.join(process.cwd(), "pnpm-lock.yaml");

  if (fileExists(lockPath)) {
    addCheck("workspace", "pnpm-lock.yaml", "pass", "Lockfile present");
  } else {
    addCheck(
      "workspace",
      "pnpm-lock.yaml",
      "warn",
      "Lockfile not found",
      'Run "pnpm install" to generate lockfile'
    );
  }
}

function checkPrismaSchema() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

  if (fileExists(schemaPath)) {
    addCheck("database", "Prisma Schema", "pass", "schema.prisma found");
  } else {
    addCheck(
      "database",
      "Prisma Schema",
      "fail",
      "schema.prisma not found",
      "Ensure prisma/schema.prisma exists in the project"
    );
  }
}

function checkPrismaClient() {
  // Check various possible locations for Prisma client
  const possiblePaths = [
    path.join(process.cwd(), "node_modules", ".prisma", "client"),
    path.join(process.cwd(), "packages", "web", "node_modules", ".prisma", "client"),
    path.join(process.cwd(), "packages", "api", "node_modules", ".prisma", "client"),
  ];

  const clientExists = possiblePaths.some((p) => fileExists(p));

  if (clientExists) {
    addCheck("database", "Prisma Client", "pass", "Prisma client generated");
  } else {
    addCheck(
      "database",
      "Prisma Client",
      "fail",
      "Prisma client not generated",
      'Run "pnpm prisma:generate" to generate the Prisma client'
    );
  }
}

async function checkDatabaseConnection() {
  if (FAST_MODE) {
    addCheck("database", "Database Connection", "warn", "Skipped in fast mode");
    return;
  }

  const dbUrl = getEnvVar("DATABASE_URL") || getEnvVar("SUPABASE_DATABASE_URL");

  if (!dbUrl) {
    addCheck("database", "Database Connection", "warn", "No DATABASE_URL configured - skipped");
    return;
  }

  try {
    // Try a simple connection test via psql if available
    const result = execCommand("psql", ["--version"]);

    if (result.success) {
      // Test actual connection
      const testResult = execCommand("psql", [dbUrl, "-c", "SELECT 1;", "-t"], {
        silent: true,
        timeout: 10000,
      });

      if (testResult.success) {
        addCheck("database", "Database Connection", "pass", "Successfully connected to database");
      } else {
        addCheck(
          "database",
          "Database Connection",
          "fail",
          "Could not connect to database",
          "Check DATABASE_URL and ensure database is accessible"
        );
      }
    } else {
      addCheck(
        "database",
        "Database Connection",
        "warn",
        "psql not available - cannot verify connection"
      );
    }
  } catch (error) {
    addCheck(
      "database",
      "Database Connection",
      "fail",
      `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      "Verify DATABASE_URL is correct and database is running"
    );
  }
}

async function checkMigrations() {
  if (FAST_MODE) {
    addCheck("database", "Migrations", "warn", "Skipped in fast mode");
    return;
  }

  const dbUrl = getEnvVar("DATABASE_URL") || getEnvVar("SUPABASE_DATABASE_URL");

  if (!dbUrl) {
    addCheck("database", "Migrations", "warn", "No DATABASE_URL - skipped");
    return;
  }

  // Check for migrations table
  try {
    const result = execCommand(
      "psql",
      [dbUrl, "-c", "SELECT COUNT(*) FROM _prisma_migrations;", "-t"],
      { silent: true, timeout: 10000 }
    );

    if (result.success) {
      const count = parseInt(result.output.trim()) || 0;
      if (count > 0) {
        addCheck("database", "Migrations", "pass", `${count} migrations applied`);
      } else {
        addCheck(
          "database",
          "Migrations",
          "warn",
          "No migrations found",
          'Run "pnpm db:migrate" to apply database migrations'
        );
      }
    } else {
      addCheck(
        "database",
        "Migrations",
        "warn",
        "Could not verify migrations",
        "Ensure _prisma_migrations table exists"
      );
    }
  } catch {
    addCheck("database", "Migrations", "warn", "Could not check migration status");
  }
}

async function checkSeedData() {
  if (FAST_MODE || FIRST_RUN) {
    addCheck("database", "Seed Data", "warn", "Skipped in fast/first-run mode");
    return;
  }

  const dbUrl = getEnvVar("DATABASE_URL") || getEnvVar("SUPABASE_DATABASE_URL");

  if (!dbUrl) {
    addCheck("database", "Seed Data", "warn", "No DATABASE_URL - skipped");
    return;
  }

  // Check for tenants table (basic seed indicator)
  try {
    const result = execCommand("psql", [dbUrl, "-c", "SELECT COUNT(*) FROM tenants;", "-t"], {
      silent: true,
      timeout: 10000,
    });

    if (result.success) {
      const count = parseInt(result.output.trim()) || 0;
      if (count > 0) {
        addCheck("database", "Seed Data", "pass", `${count} tenant(s) found`);
      } else {
        addCheck(
          "database",
          "Seed Data",
          "warn",
          "No seed data found",
          'Run "pnpm demo:seed" to populate demo data'
        );
      }
    } else {
      addCheck("database", "Seed Data", "warn", "Could not verify seed data");
    }
  } catch {
    addCheck("database", "Seed Data", "warn", "Could not check seed status");
  }

  // Also check for demo data files
  const demoDir = path.join(process.cwd(), "demo", "data");
  const requiredFiles = [
    "demo_stripe_transactions.json",
    "demo_bank_transactions.json",
    "demo_expected_matches.json",
  ];

  if (!fs.existsSync(demoDir)) {
    addCheck(
      "database",
      "Demo Data Files",
      "fail",
      "Demo data directory does not exist",
      'Run "pnpm demo:seed" to generate demo data files'
    );
    return;
  }

  const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(demoDir, file)));

  if (missingFiles.length > 0) {
    addCheck(
      "database",
      "Demo Data Files",
      "fail",
      `Missing demo data files: ${missingFiles.join(", ")}`,
      'Run "pnpm demo:seed" to generate missing demo data files'
    );
    return;
  }

  // Check if files are valid JSON
  try {
    requiredFiles.forEach((file) => {
      const filePath = path.join(demoDir, file);
      JSON.parse(fs.readFileSync(filePath, "utf-8"));
    });
    addCheck("database", "Demo Data Files", "pass", "All demo data files exist and are valid JSON");
  } catch (err) {
    addCheck(
      "database",
      "Demo Data Files",
      "fail",
      "One or more demo data files contain invalid JSON",
      'Run "pnpm demo:seed" to regenerate demo data files'
    );
  }
}

function checkWorkspaceFiles() {
  const requiredFiles = ["package.json", "pnpm-workspace.yaml", "tsconfig.json", "turbo.json"];

  const missing: string[] = [];

  for (const file of requiredFiles) {
    if (!fileExists(file)) {
      missing.push(file);
    }
  }

  if (missing.length === 0) {
    addCheck("workspace", "Workspace Files", "pass", "All required files present");
  } else {
    addCheck(
      "workspace",
      "Workspace Files",
      "fail",
      `Missing: ${missing.join(", ")}`,
      "Ensure all required workspace files exist"
    );
  }
}

function checkGitStatus() {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8", stdio: "pipe" });
    if (status.trim().length === 0) {
      addCheck("workspace", "Git Status", "pass", "Working directory is clean");
    } else {
      const changes = status.trim().split("\n").length;
      addCheck(
        "workspace",
        "Git Status",
        "warn",
        `${changes} uncommitted change(s)`,
        "Consider committing or stashing changes before proceeding"
      );
    }
  } catch {
    addCheck("workspace", "Git Status", "warn", "Could not check git status");
  }
}

function checkBuild() {
  // Skip build check in fast mode or first-run mode
  if (FAST_MODE || FIRST_RUN) {
    addCheck("workspace", "Build", "warn", "Skipped in fast/first-run mode");
    return;
  }

  try {
    const result = execCommand("pnpm", ["--filter", "@settler/web", "build"], { timeout: 180000 });

    if (result.success) {
      addCheck("workspace", "Build", "pass", "Build successful");
    } else {
      addCheck(
        "workspace",
        "Build",
        "fail",
        "Build failed",
        'Run "pnpm build" to see detailed errors'
      );
    }
  } catch (error) {
    addCheck(
      "workspace",
      "Build",
      "fail",
      `Build check failed: ${error instanceof Error ? error.message : String(error)}`,
      "Check build output for errors"
    );
  }
}

// ---------------------------------------------------------------------------
// Output & Exit
// ---------------------------------------------------------------------------

function generateOutput(results: Check[]): DoctorResult {
  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warn").length;
  const failures = results.filter((r) => r.status === "fail").length;

  let status: "pass" | "warn" | "fail" = "pass";
  if (failures > 0) status = "fail";
  else if (warnings > 0) status = "warn";

  return {
    status,
    timestamp: new Date().toISOString(),
    summary: {
      passed,
      warnings,
      failures,
      total: results.length,
    },
    checks: results,
  };
}

function printHumanReadable(results: Check[]) {
  const output = generateOutput(results);

  console.log("\n🏥 Settler Doctor - Local Environment Health Check\n");
  console.log("=".repeat(55));

  const categories: Category[] = ["toolchain", "environment", "services", "database", "workspace"];
  const categoryLabels: Record<Category, string> = {
    toolchain: "🔧 TOOLCHAIN",
    environment: "📦 ENVIRONMENT",
    services: "🔌 SERVICES",
    database: "💾 DATABASE",
    workspace: "📁 WORKSPACE",
  };

  for (const category of categories) {
    const categoryChecks = results.filter((r) => r.category === category);
    if (categoryChecks.length === 0) continue;

    console.log(`\n[${categoryLabels[category]}]`);

    for (const check of categoryChecks) {
      const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
      console.log(`${icon} ${check.name}: ${check.message}`);
      if (check.remediation) {
        console.log(`   → ${check.remediation}`);
      }
    }
  }

  console.log("\n" + "=".repeat(55));
  console.log(
    `\n📊 Summary: ${output.summary.passed} passed, ${output.summary.warnings} warnings, ${output.summary.failures} failures\n`
  );

  if (output.status === "fail") {
    console.log("❌ FAILURES DETECTED - Please fix the errors above before proceeding\n");
  } else if (output.status === "warn") {
    console.log("⚠️  WARNINGS PRESENT - Review the warnings above\n");
  } else {
    console.log("✅ All checks passed!\n");
  }

  return output;
}

function printJsonOutput(results: Check[]) {
  const output = generateOutput(results);
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🏥 Running Settler Doctor...\n");

  // Toolchain checks
  checkNodeVersion();
  checkPnpmVersion();
  checkDocker();
  checkDockerCompose();
  checkGit();

  // Environment checks
  checkRequiredEnvVars();
  checkDatabaseEnvVars();
  checkOptionalEnvVars();

  // Service connectivity
  await checkPostgres();
  await checkRedis();
  await checkTigerBeetle();
  await checkWebPort();

  // Database health
  checkNodeModules();
  checkPnpmLockfile();
  checkPrismaSchema();
  checkPrismaClient();
  await checkDatabaseConnection();
  await checkMigrations();
  await checkSeedData();

  // Workspace
  checkWorkspaceFiles();
  checkGitStatus();

  // Run build check
  checkBuild();

  // Output results
  if (JSON_OUTPUT) {
    printJsonOutput(results);
  } else {
    const output = printHumanReadable(results);

    // Exit with appropriate code
    if (output.status === "fail") {
      process.exit(1);
    } else if (output.status === "warn") {
      process.exit(2);
    } else {
      process.exit(0);
    }
  }
}

main().catch((error) => {
  console.error("❌ Doctor script crashed:", error);
  process.exit(1);
});
