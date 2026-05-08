#!/usr/bin/env node

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { config } from "dotenv";
import nodeContract from "../../../scripts/node-version-contract.cjs";

nodeContract.assertSupportedNodeVersion("@settler/web build");

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");

const shouldLoadLocalEnv = process.env.VERCEL !== "1" && process.env.CI !== "true";
if (shouldLoadLocalEnv) {
  const envLocal = resolve(repoRoot, ".env.local");
  if (existsSync(envLocal)) {
    config({ path: envLocal });
  }
}

const manifest = JSON.parse(readFileSync(resolve(repoRoot, "config", "env.required.json"), "utf8"));

const BUILD_REQUIRED_GROUP_LABELS = new Set(["database-url"]);
const REQUIRED_GROUPS = manifest.requirements.groups.filter((group) =>
  BUILD_REQUIRED_GROUP_LABELS.has(group.label)
);

const SECRET_PUBLIC_COLLISION_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
}

const missing = REQUIRED_GROUPS.filter((group) => !group.keys.some((key) => hasValue(key)));
const leakedToClient = SECRET_PUBLIC_COLLISION_KEYS.filter((key) => hasValue(`NEXT_PUBLIC_${key}`));

if (missing.length > 0 || leakedToClient.length > 0) {
  console.error("❌ Build-time environment validation failed.");

  if (missing.length > 0) {
    console.error("Missing required environment key groups:");
    for (const group of missing) {
      console.error(`  - ${group.label}: ${group.keys.join(" or ")}`);
    }
  }

  if (leakedToClient.length > 0) {
    console.error("Detected secret-like keys leaked with NEXT_PUBLIC_ prefix:");
    for (const leakedKey of leakedToClient) {
      console.error(`  - NEXT_PUBLIC_${leakedKey}`);
    }
  }

  console.error("Set required keys in Vercel environment settings for hosted builds/runs.");
  process.exit(1);
}

console.log("✅ Build-time environment validation passed for required key groups.");
