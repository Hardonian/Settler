#!/usr/bin/env tsx
/**
 * GitHub Secrets Verification Script
 *
 * This script analyzes the codebase to identify all environment variables
 * that should be stored in GitHub secrets and compares them against
 * what's actually referenced in GitHub Actions workflows.
 *
 * Usage:
 *   tsx scripts/verify-github-secrets.ts
 *
 * Note: This script cannot directly access GitHub secrets (for security reasons).
 * It analyzes workflow files to see what secrets are referenced and what
 * environment variables are used in the codebase.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

interface SecretReference {
  name: string;
  workflows: string[];
  required: boolean;
  category: string;
  notes?: string;
}

interface EnvVarUsage {
  name: string;
  files: string[];
  isPublic: boolean;
  required: boolean;
}

const WORKFLOWS_DIR = ".github/workflows";
const SECRET_PATTERN = /\${{ secrets\.(\w+) }}/g;
const ENV_PATTERN = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
const NEXT_PUBLIC_PATTERN = /NEXT_PUBLIC_/;

function extractSecretsFromWorkflow(filePath: string): Set<string> {
  const content = readFileSync(filePath, "utf-8");
  const secrets = new Set<string>();
  let match;

  while ((match = SECRET_PATTERN.exec(content)) !== null) {
    secrets.add(match[1]);
  }

  return secrets;
}

function extractEnvVarsFromFile(filePath: string): Set<string> {
  try {
    const content = readFileSync(filePath, "utf-8");
    const envVars = new Set<string>();
    let match;

    while ((match = ENV_PATTERN.exec(content)) !== null) {
      envVars.add(match[1]);
    }

    return envVars;
  } catch (error) {
    return new Set();
  }
}

function getAllWorkflowFiles(): string[] {
  try {
    return readdirSync(WORKFLOWS_DIR)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
      .map((file) => join(WORKFLOWS_DIR, file));
  } catch (error) {
    console.error(`Error reading workflows directory: ${error}`);
    return [];
  }
}

function scanCodebaseForEnvVars(): Map<string, EnvVarUsage> {
  const envVars = new Map<string, EnvVarUsage>();

  // Scan common directories
  const scanDirs = [
    "packages/web/src",
    "packages/api/src",
    "scripts",
    "packages/web/src/app",
    "packages/web/src/lib",
  ];

  function scanDirectory(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js"))
        ) {
          const vars = extractEnvVarsFromFile(fullPath);
          for (const varName of vars) {
            if (!envVars.has(varName)) {
              envVars.set(varName, {
                name: varName,
                files: [],
                isPublic: NEXT_PUBLIC_PATTERN.test(varName),
                required: false,
              });
            }
            envVars.get(varName)!.files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that don't exist or can't be read
    }
  }

  for (const dir of scanDirs) {
    scanDirectory(dir);
  }

  return envVars;
}

function categorizeSecret(name: string): string {
  if (name.includes("SUPABASE")) return "Database (Supabase)";
  if (name.includes("DATABASE") || name.includes("DB_")) return "Database";
  if (name.includes("REDIS") || name.includes("UPSTASH")) return "Redis";
  if (name.includes("STRIPE")) return "Payment (Stripe)";
  if (name.includes("RESEND")) return "Email (Resend)";
  if (name.includes("SENTRY")) return "Observability (Sentry)";
  if (name.includes("VERCEL")) return "CI/CD (Vercel)";
  if (name.includes("JWT") || name.includes("ENCRYPTION") || name.includes("SECRET"))
    return "Security";
  if (name.includes("E2E") || name.includes("TEST")) return "Testing";
  if (name.startsWith("NEXT_PUBLIC_")) return "Client-Side (Public)";
  if (name.includes("GITHUB")) return "CI/CD (GitHub)";
  if (name.includes("SNYK")) return "Security Scanning";
  return "Other";
}

function main() {
  console.log("🔍 GitHub Secrets Verification\n");
  console.log("=".repeat(80));

  // Step 1: Extract secrets from workflows
  console.log("\n📋 Step 1: Analyzing GitHub Actions workflows...\n");
  const workflowFiles = getAllWorkflowFiles();
  const secretsInWorkflows = new Map<string, SecretReference>();

  for (const workflowFile of workflowFiles) {
    const secrets = extractSecretsFromWorkflow(workflowFile);
    const workflowName = workflowFile.split("/").pop() || workflowFile;

    for (const secret of secrets) {
      if (!secretsInWorkflows.has(secret)) {
        secretsInWorkflows.set(secret, {
          name: secret,
          workflows: [],
          required: true,
          category: categorizeSecret(secret),
        });
      }
      secretsInWorkflows.get(secret)!.workflows.push(workflowName);
    }
  }

  console.log(
    `Found ${secretsInWorkflows.size} unique secrets referenced in ${workflowFiles.length} workflows\n`
  );

  // Step 2: Scan codebase for environment variables
  console.log("📋 Step 2: Scanning codebase for environment variable usage...\n");
  const envVarsInCode = scanCodebaseForEnvVars();
  console.log(`Found ${envVarsInCode.size} unique environment variables in codebase\n`);

  // Step 3: Identify critical variables that should be in secrets
  console.log("📋 Step 3: Identifying critical variables...\n");

  const criticalVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_ACCESS_TOKEN",
    "DATABASE_URL",
    "JWT_SECRET",
    "ENCRYPTION_KEY",
    "STRIPE_SECRET_KEY",
    "RESEND_API_KEY",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ];

  const missingCritical: string[] = [];
  const foundCritical: string[] = [];

  for (const criticalVar of criticalVars) {
    if (secretsInWorkflows.has(criticalVar)) {
      foundCritical.push(criticalVar);
    } else {
      missingCritical.push(criticalVar);
    }
  }

  // Step 4: Check for NEXT_PUBLIC_ variables that need special handling
  console.log("📋 Step 4: Checking NEXT_PUBLIC_ variables...\n");
  const nextPublicVars = Array.from(envVarsInCode.keys()).filter((v) =>
    v.startsWith("NEXT_PUBLIC_")
  );

  // Step 5: Generate report
  console.log("\n" + "=".repeat(80));
  console.log("📊 VERIFICATION REPORT\n");
  console.log("=".repeat(80));

  // Secrets found in workflows
  console.log("\n✅ Secrets Referenced in Workflows:\n");
  const byCategory = new Map<string, SecretReference[]>();
  for (const secret of secretsInWorkflows.values()) {
    if (!byCategory.has(secret.category)) {
      byCategory.set(secret.category, []);
    }
    byCategory.get(secret.category)!.push(secret);
  }

  for (const [category, secrets] of Array.from(byCategory.entries()).sort()) {
    console.log(`\n${category}:`);
    for (const secret of secrets.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ✅ ${secret.name}`);
      console.log(`     Used in: ${secret.workflows.join(", ")}`);
    }
  }

  // Critical variables status
  console.log("\n\n🔴 Critical Variables Status:\n");
  console.log(`✅ Found in workflows: ${foundCritical.length}/${criticalVars.length}`);
  foundCritical.forEach((v) => console.log(`   ✅ ${v}`));

  if (missingCritical.length > 0) {
    console.log(`\n⚠️  Missing from workflows: ${missingCritical.length}`);
    missingCritical.forEach((v) => {
      const inCode = envVarsInCode.has(v);
      console.log(
        `   ${inCode ? "⚠️" : "❓"} ${v}${inCode ? " (used in codebase)" : " (not found in codebase)"}`
      );
    });
  }

  // NEXT_PUBLIC_ variables
  console.log("\n\n🌐 NEXT_PUBLIC_ Variables (Client-Side):\n");
  console.log(`Found ${nextPublicVars.length} NEXT_PUBLIC_ variables in codebase:`);
  const nextPublicInSecrets = nextPublicVars.filter((v) => secretsInWorkflows.has(v));
  const nextPublicNotInSecrets = nextPublicVars.filter((v) => !secretsInWorkflows.has(v));

  if (nextPublicInSecrets.length > 0) {
    console.log(`\n⚠️  Found in GitHub secrets (should use non-prefixed version):`);
    nextPublicInSecrets.forEach((v) => console.log(`   ⚠️  ${v}`));
    console.log(
      `\n   Note: NEXT_PUBLIC_ variables should be set in Vercel dashboard, not GitHub secrets.`
    );
    console.log(`   Use the non-prefixed version (e.g., SUPABASE_URL) in GitHub secrets.`);
  }

  if (nextPublicNotInSecrets.length > 0) {
    console.log(`\n✅ Not in GitHub secrets (correct - should be in Vercel only):`);
    const important = nextPublicNotInSecrets.filter(
      (v) => v.includes("SUPABASE") || v.includes("SITE_URL") || v.includes("APP_URL")
    );
    important.forEach((v) => console.log(`   ✅ ${v}`));

    if (nextPublicNotInSecrets.length > important.length) {
      console.log(
        `\n   Other NEXT_PUBLIC_ variables (${nextPublicNotInSecrets.length - important.length}):`
      );
      nextPublicNotInSecrets
        .filter((v) => !important.includes(v))
        .forEach((v) => console.log(`   ℹ️  ${v}`));
    }
  }

  // Recommendations
  console.log("\n\n💡 Recommendations:\n");
  console.log("1. Ensure all critical variables listed above are set in GitHub repository secrets");
  console.log("2. NEXT_PUBLIC_ variables should be set in Vercel dashboard (not GitHub secrets)");
  console.log("3. Use non-prefixed versions (e.g., SUPABASE_URL) in GitHub secrets");
  console.log("4. Vercel will expose them as NEXT_PUBLIC_ variants if configured");
  console.log("5. Review the checklist in docs/github-secrets-checklist.md for complete list");

  // Summary
  console.log("\n\n" + "=".repeat(80));
  console.log("📈 SUMMARY\n");
  console.log("=".repeat(80));
  console.log(`Total secrets in workflows: ${secretsInWorkflows.size}`);
  console.log(`Critical variables found: ${foundCritical.length}/${criticalVars.length}`);
  console.log(`Critical variables missing: ${missingCritical.length}`);
  console.log(`NEXT_PUBLIC_ variables: ${nextPublicVars.length}`);
  console.log(`NEXT_PUBLIC_ incorrectly in secrets: ${nextPublicInSecrets.length}`);

  if (missingCritical.length > 0 || nextPublicInSecrets.length > 0) {
    console.log("\n⚠️  Action required: Review missing critical variables and NEXT_PUBLIC_ usage");
    process.exit(1);
  } else {
    console.log("\n✅ All critical variables are properly configured!");
  }
}

if (require.main === module) {
  main();
}

export { extractSecretsFromWorkflow, scanCodebaseForEnvVars };
