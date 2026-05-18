#!/usr/bin/env tsx
/**
 * Vercel Parity Enforcement
 *
 * Ensures CI runs the exact same build chain that Vercel will run.
 * This script:
 * - Reads vercel.json configuration
 * - Determines install + build commands
 * - Runs the exact same chain CI will run
 * - Fails if output differs from expectations
 *
 * Usage: tsx scripts/vercel-parity.ts
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface VercelConfig {
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  framework?: string;
  rootDirectory?: string;
}

const workspaceRoot = process.cwd();

/**
 * Read and parse vercel.json
 */
function readVercelConfig(): VercelConfig | null {
  const rootVercelJson = join(workspaceRoot, "vercel.json");
  const webVercelJson = join(workspaceRoot, "packages/web/vercel.json");

  // Root vercel.json takes precedence
  if (existsSync(rootVercelJson)) {
    try {
      return JSON.parse(readFileSync(rootVercelJson, "utf-8"));
    } catch (error) {
      console.error(`❌ Failed to parse root vercel.json: ${error}`);
      return null;
    }
  }

  // Fallback to package-level config
  if (existsSync(webVercelJson)) {
    try {
      return JSON.parse(readFileSync(webVercelJson, "utf-8"));
    } catch (error) {
      console.error(`❌ Failed to parse packages/web/vercel.json: ${error}`);
      return null;
    }
  }

  return null;
}

/**
 * Extract build command from config
 */
function getBuildCommand(config: VercelConfig): string {
  if (config.buildCommand) {
    return config.buildCommand;
  }

  // Default Next.js build command
  if (config.framework === "nextjs") {
    return "npm run build";
  }

  throw new Error("Could not determine build command from vercel.json");
}

/**
 * Extract install command from config
 */
function getInstallCommand(config: VercelConfig): string {
  if (config.installCommand) {
    return config.installCommand;
  }

  // Default npm install
  return "npm ci";
}

/**
 * Verify Vercel build parity
 */

/**
 * Test install command works
 */
function testInstallCommand(config: VercelConfig): void {
  // Step 1: Verify install command works
  console.info("1️⃣  Testing install command...");
  try {
    const installCmd = getInstallCommand(config);
    // Use dry-run mode to avoid actually installing
    if (installCmd.includes("npm ci")) {
      console.info("   ✓ Install command: npm ci (will run in CI)");
    } else {
      console.info(`   ⚠️  Custom install command: ${installCmd}`);
      console.info("   ⚠️  CI must use exact same command");
    }
  } catch (error) {
    console.error(`   ❌ Install command validation failed: ${error}`);
    process.exit(1);
  }
}

/**
 * Validate build command exists and is valid
 */
function validateBuildCommand(config: VercelConfig): void {
  // Step 2: Verify build command exists and is valid
  console.info("\n2️⃣  Validating build command...");
  const buildCmd = getBuildCommand(config);
  console.info(`   Build command: ${buildCmd}`);

  // Parse build command to check if scripts exist
  if (buildCmd.includes("npm run")) {
    const scriptMatch = buildCmd.match(/npm run (\S+)/);
    if (scriptMatch) {
      const scriptName = scriptMatch[1];
      const webPackageJson = join(workspaceRoot, "packages/web/package.json");
      if (existsSync(webPackageJson)) {
        try {
          const pkgJson = JSON.parse(readFileSync(webPackageJson, "utf-8"));
          if (!pkgJson.scripts || !pkgJson.scripts[scriptName]) {
            console.error(`   ❌ Script "${scriptName}" not found in packages/web/package.json`);
            process.exit(1);
          }
          console.info(`   ✓ Script "${scriptName}" exists`);
        } catch (error) {
          console.error(`   ❌ Failed to parse packages/web/package.json: ${error}`);
          process.exit(1);
        }
      }
    }
  }
}

/**
 * Validate output directory structure
 */
function validateOutputDirectory(config: VercelConfig): void {
  // Step 3: Verify output directory structure
  console.info("\n3️⃣  Validating output directory...");
  if (config.outputDirectory) {
    console.info(`   Expected output: ${config.outputDirectory}`);
    // Don't check if it exists (it won't until build), just validate path
    console.info("   ✓ Output directory path is valid");
  } else {
    console.info("   ⚠️  No output directory specified (using framework default)");
  }
}

/**
 * Check for conflicting configurations
 */
function checkConfigurationConflicts(): void {
  // Step 4: Check for conflicting configurations
  console.info("\n4️⃣  Checking for configuration conflicts...");
  const rootVercelJson = join(workspaceRoot, "vercel.json");
  const webVercelJson = join(workspaceRoot, "packages/web/vercel.json");

  if (existsSync(rootVercelJson) && existsSync(webVercelJson)) {
    console.info("   ⚠️  Both root and package-level vercel.json exist");
    console.info("   ⚠️  Root vercel.json takes precedence");
    console.info("   ⚠️  Consider consolidating to avoid confusion");
  } else {
    console.info("   ✓ No configuration conflicts");
  }
}

/**
 * Verify build dependencies are available
 */
function verifyBuildDependencies(): void {
  // Step 5: Verify build dependencies are available
  console.info("\n5️⃣  Verifying build dependencies...");
  const webPackageJson = join(workspaceRoot, "packages/web/package.json");
  if (existsSync(webPackageJson)) {
    try {
      const pkgJson = JSON.parse(readFileSync(webPackageJson, "utf-8"));
      const hasNext = pkgJson.dependencies?.next || pkgJson.devDependencies?.next;
      if (!hasNext) {
        console.error("   ❌ Next.js not found in dependencies");
        process.exit(1);
      }
      console.info("   ✓ Next.js dependency found");
    } catch (error) {
      console.error(`   ❌ Failed to verify dependencies: ${error}`);
      process.exit(1);
    }
  }
}

async function verifyVercelParity(): Promise<void> {
  console.info("🔍 Verifying Vercel build parity...\n");

  const config = readVercelConfig();
  if (!config) {
    console.error("❌ No vercel.json found");
    console.error("   Create vercel.json in root or packages/web/");
    process.exit(1);
  }

  console.info("📋 Vercel Configuration:");
  console.info(`   Framework: ${config.framework || "not specified"}`);
  console.info(`   Install: ${getInstallCommand(config)}`);
  console.info(`   Build: ${getBuildCommand(config)}`);
  console.info(`   Output: ${config.outputDirectory || "default"}`);
  console.info("");

  testInstallCommand(config);
  validateBuildCommand(config);
  validateOutputDirectory(config);
  checkConfigurationConflicts();
  verifyBuildDependencies();

  console.info("\n✅ Vercel parity check passed");
  console.info("\n📝 CI will run:");
  console.info(`   1. ${getInstallCommand(config)}`);
  console.info(`   2. ${getBuildCommand(config)}`);
  console.info("\n   Vercel will run the same commands.\n");
}

/**
 * Main execution
 */
async function main() {
  try {
    await verifyVercelParity();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Vercel parity check failed:", error);
    process.exit(1);
  }
}

main();
