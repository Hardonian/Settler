/**
 * Load Environment Variables for Tests
 *
 * Utility to load .env files in the same priority order as Next.js:
 * 1. .env.local (highest priority)
 * 2. .env.development
 * 3. .env
 *
 * Also checks packages/web/ directory
 *
 * This ensures tests have access to the same environment variables
 * as the application in preview/production environments.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

const envFiles = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env.development"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "packages/web/.env.local"),
  resolve(process.cwd(), "packages/web/.env.development"),
  resolve(process.cwd(), "packages/web/.env"),
];

let loadedFiles: string[] = [];

export function loadEnvFiles(): string[] {
  loadedFiles = [];

  envFiles.forEach((file) => {
    if (existsSync(file)) {
      config({ path: file, override: false });
      loadedFiles.push(file);
    }
  });

  return loadedFiles;
}

// Auto-load on import
loadEnvFiles();

// CLI usage - check if run directly
const isMainModule =
  (typeof require !== "undefined" && require.main === module) ||
  (process.argv[1] && process.argv[1].endsWith("load-env-for-tests.ts")) ||
  (process.argv[1] && process.argv[1].endsWith("load-env-for-tests.js"));

if (isMainModule) {
  const files = loadEnvFiles();

  if (files.length > 0) {
    console.log("✅ Loaded environment variables from:");
    files.forEach((file) => console.log(`   - ${file}`));
  } else {
    console.log("⚠️  No .env files found. Using system environment variables only.");
    console.log("   Expected locations:");
    envFiles.forEach((file) => console.log(`   - ${file}`));
  }

  // Show key variables (masked)
  const keyVars = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  console.log("\n📋 Environment variables status:");
  keyVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      const masked =
        value.length > 20
          ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
          : "***";
      console.log(`   ✅ ${varName}: ${masked}`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
    }
  });
}
