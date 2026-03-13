#!/usr/bin/env node

const REQUIRED_GROUPS = [
  {
    label: "Supabase URL (public)",
    keys: ["NEXT_PUBLIC_SUPABASE_URL"],
    visibility: "public",
  },
  {
    label: "Supabase anon key (public)",
    keys: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    visibility: "public",
  },
  {
    label: "Database connection (server-only)",
    keys: ["DATABASE_URL", "SUPABASE_DATABASE_URL", "DIRECT_URL"],
    visibility: "server",
  },
];

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
      console.error(`  - ${group.label} [${group.visibility}]: ${group.keys.join(" or ")}`);
    }
  }

  if (leakedToClient.length > 0) {
    console.error("Detected secret-like keys leaked with NEXT_PUBLIC_ prefix:");
    for (const leakedKey of leakedToClient) {
      console.error(`  - NEXT_PUBLIC_${leakedKey}`);
    }
  }

  console.error("Set these keys in build env and keep secret keys server-only.");
  process.exit(1);
}

console.log("✅ Build-time environment validation passed for required key groups.");
