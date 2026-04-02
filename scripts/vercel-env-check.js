#!/usr/bin/env node
/**
 * Vercel Environment Variable Validation Script
 *
 * This script safely dumps and validates environment variables available
 * during the Vercel build process. It does NOT log sensitive values.
 *
 * Usage: node scripts/vercel-env-check.js
 */

const requiredVars = ["NODE_VERSION", "VERCEL", "VERCEL_ENV"];

const nodeContract = require("./node-version-contract.cjs");

const recommendedVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const optionalVars = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "KV_REST_API_URL",
  "EDGE_CONFIG",
  "BLOB_READ_WRITE_TOKEN",
];

function maskValue(value) {
  if (!value || value.length < 8) return "***";
  return value.substring(0, 4) + "***" + value.substring(value.length - 4);
}

function checkEnvVars() {
  const results = {
    required: {},
    recommended: {},
    optional: {},
    missing: [],
    warnings: [],
  };

  // Check required vars
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      results.required[varName] = maskValue(value);
    } else {
      results.missing.push(varName);
      results.warnings.push(`Missing required variable: ${varName}`);
    }
  }

  // Check recommended vars
  for (const varName of recommendedVars) {
    const value = process.env[varName];
    if (value) {
      results.recommended[varName] = maskValue(value);
    } else {
      results.warnings.push(`Missing recommended variable: ${varName} (may cause runtime errors)`);
    }
  }

  // Check optional vars
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      results.optional[varName] = maskValue(value);
    }
  }

  // Check Node.js version
  const nodeVersion = process.env.NODE_VERSION || process.version;
  results.nodeVersion = nodeVersion;

  try {
    nodeContract.assertSupportedNodeVersion("Vercel env check");
  } catch (error) {
    const { requiredVersion, requiredRange } = nodeContract.formatNodeRequirement();
    results.warnings.push(
      `Node.js version ${nodeVersion} may not match .nvmrc (${requiredVersion}) / engines (${requiredRange}). Set NODE_VERSION in Vercel settings.`
    );
  }

  // Check Vercel environment
  results.vercelEnv = process.env.VERCEL_ENV || "unknown";
  results.vercelRegion = process.env.VERCEL_REGION || "unknown";

  return results;
}

function main() {
  console.log("🔍 Vercel Environment Variable Check\n");

  const results = checkEnvVars();

  console.log("📋 Environment Summary:");
  console.log(`   Node.js: ${results.nodeVersion}`);
  console.log(`   Vercel Environment: ${results.vercelEnv}`);
  console.log(`   Vercel Region: ${results.vercelRegion}\n`);

  console.log("✅ Required Variables:");
  for (const [key, value] of Object.entries(results.required)) {
    console.log(`   ${key}: ${value}`);
  }

  if (Object.keys(results.recommended).length > 0) {
    console.log("\n📌 Recommended Variables (present):");
    for (const [key, value] of Object.entries(results.recommended)) {
      console.log(`   ${key}: ${value}`);
    }
  }

  if (Object.keys(results.optional).length > 0) {
    console.log("\n🔧 Optional Variables (present):");
    for (const [key, value] of Object.entries(results.optional)) {
      console.log(`   ${key}: ${value}`);
    }
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warning of results.warnings) {
      console.log(`   ${warning}`);
    }
  }

  if (results.missing.length > 0) {
    console.log("\n❌ Missing Required Variables:");
    for (const missing of results.missing) {
      console.log(`   ${missing}`);
    }
    console.log(
      "\n💡 Action: Add these variables in Vercel Project Settings → Environment Variables"
    );
    process.exit(1);
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  Build will continue but may have runtime issues.");
    process.exit(0);
  }

  console.log("\n✅ All checks passed!");
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvVars };
