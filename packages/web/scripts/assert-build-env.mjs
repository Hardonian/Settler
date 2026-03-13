#!/usr/bin/env node

const REQUIRED_GROUPS = [
  {
    label: "Supabase URL (public)",
    keys: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
    visibility: "public",
  },
  {
    label: "Supabase anon key (public)",
    keys: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
    visibility: "public",
  },
  {
    label: "Database connection (server-only)",
    keys: ["DATABASE_URL", "SUPABASE_DATABASE_URL", "DIRECT_URL"],
    visibility: "server",
  },
];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
}

const missing = REQUIRED_GROUPS.filter((group) => !group.keys.some((key) => hasValue(key)));

if (missing.length > 0) {
  console.error("❌ Build-time environment validation failed.");
  console.error("Missing required environment key groups:");
  for (const group of missing) {
    console.error(`  - ${group.label} [${group.visibility}]: ${group.keys.join(" or ")}`);
  }
  console.error("Set these keys in the build environment (Vercel project env / CI env injection).");
  process.exit(1);
}

console.log("✅ Build-time environment validation passed for required key groups.");
