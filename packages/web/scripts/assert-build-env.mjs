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

const BUILD_REQUIRED_GROUP_LABELS = new Set(["supabase-url", "supabase-anon", "database-url"]);
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

if (leakedToClient.length > 0) {
  console.error("❌ Build-time security validation failed.");
  console.error("Detected secret-like keys leaked with NEXT_PUBLIC_ prefix:");
  for (const leakedKey of leakedToClient) {
    console.error(`  - NEXT_PUBLIC_${leakedKey}`);
  }
  process.exit(1);
}

const skipEnvValidation =
  process.env.SKIP_ENV_VALIDATION === "true" || process.env.SKIP_ENV_VALIDATION === "1";

if (missing.length > 0) {
  if (skipEnvValidation) {
    console.warn("⚠️  Build-time environment validation warning (SKIP_ENV_VALIDATION is active):");
    for (const group of missing) {
      console.warn(`  - Missing ${group.label}: ${group.keys.join(" or ")}`);
    }
    console.warn("Injecting safe build-time mock fallbacks for static compilation.");
    if (!hasValue("NEXT_PUBLIC_SUPABASE_URL")) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
    }
    if (!hasValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-anon-key";
    }
    if (!hasValue("DATABASE_URL")) {
      process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/settler";
    }
  } else {
    console.error("❌ Build-time environment validation failed.");
    console.error("Missing required environment key groups:");
    for (const group of missing) {
      console.error(`  - ${group.label}: ${group.keys.join(" or ")}`);
    }
    console.error(
      "Set required keys in Vercel environment settings or pass SKIP_ENV_VALIDATION=true for static-only previews."
    );
    process.exit(1);
  }
} else {
  console.log("✅ Build-time environment validation passed for required key groups.");
}

import { rmSync } from "node:fs";
try {
  rmSync(resolve(__dirname, "..", ".next", "next.lock"), { force: true });
  rmSync(resolve(__dirname, "..", ".next", "build.lock"), { force: true });
  rmSync(resolve(__dirname, "..", ".next", "trace"), { force: true });
} catch {}
