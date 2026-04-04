#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocalPath = path.join(repoRoot, ".env.local");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: false });
}

const manifest = JSON.parse(
  readFileSync(new URL("../config/env.required.json", import.meta.url), "utf8")
);
const tracked = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "DIRECT_URL",
  "SUPABASE_DB_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_GIT_COMMIT_SHA",
  "DOPPLER_TOKEN",
]);

function hasValue(name, env = process.env) {
  return Boolean(env[name] && String(env[name]).trim().length > 0);
}

function resolveGroup(group, env = process.env) {
  const matched = group.keys.filter((key) => hasValue(key, env));
  return { matched, satisfied: matched.length > 0, via: matched[0] ?? null };
}

function printStatus(name, env = process.env) {
  const value = hasValue(name, env) ? "present" : "missing";
  console.log(`- ${name}: ${value}`);
}

function childSnapshot(command, args) {
  const payload = JSON.stringify([...tracked]);
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "").trim() || `${command} failed`,
    };
  }
  const lines = (result.stdout || "").trim().split("\n").filter(Boolean);
  const last = lines[lines.length - 1] || "{}";
  try {
    const parsed = JSON.parse(last);
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: `unable to parse ${command} snapshot` };
  }
}

function runRequiredCheck() {
  let failed = false;
  for (const group of manifest.requirements.groups) {
    const result = resolveGroup(group);
    const state = result.satisfied ? "✅" : group.required ? "❌" : "⚠️";
    console.log(
      `${state} ${group.label}: ${result.satisfied ? `satisfied via ${result.via}` : "missing"}`
    );
    if (group.required && !result.satisfied) failed = true;
  }
  if (failed) process.exit(1);
}

function runParityCheck() {
  let failed = false;
  for (const variable of manifest.variables) {
    if (!variable.aliases?.length) continue;
    const primary = process.env[variable.name];
    for (const alias of variable.aliases) {
      const aliasValue = process.env[alias];
      if (primary && aliasValue && primary !== aliasValue) {
        failed = true;
        console.log(`❌ alias drift: ${variable.name} != ${alias}`);
      }
    }
  }

  const required = manifest.requirements.groups.map((group) => ({
    label: group.label,
    ...resolveGroup(group),
  }));

  for (const group of required) {
    if (!group.satisfied) {
      console.log(`❌ parity gap: ${group.label} unresolved`);
      failed = true;
    } else {
      console.log(`✅ parity: ${group.label} via ${group.via}`);
    }
  }

  if (failed) process.exit(1);
}

function runOwnershipCheck() {
  let failed = false;
  for (const variable of manifest.variables) {
    const hasPublicPrefix = variable.name.startsWith("NEXT_PUBLIC_");
    if (variable.surface === "public" && !hasPublicPrefix) {
      console.log(
        `❌ ownership drift: ${variable.name} marked public but missing NEXT_PUBLIC_ prefix`
      );
      failed = true;
    }
    if (variable.surface === "server" && hasPublicPrefix) {
      console.log(
        `❌ ownership drift: ${variable.name} marked server but uses NEXT_PUBLIC_ prefix`
      );
      failed = true;
    }
  }

  const secretLeakDenylist = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "SUPABASE_DATABASE_URL",
    "SUPABASE_DB_URL",
    "DIRECT_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "ENCRYPTION_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "OPENAI_API_KEY",
  ];

  const leakedSecrets = secretLeakDenylist.filter((name) => hasValue(`NEXT_PUBLIC_${name}`));

  if (leakedSecrets.length > 0) {
    failed = true;
    for (const leaked of leakedSecrets) {
      console.log(`❌ secret leak: NEXT_PUBLIC_${leaked} should not be set`);
    }
  }

  if (!failed) {
    console.log("✅ ownership model check passed");
  }
  if (failed) process.exit(1);
}

function runTrace() {
  console.log("## env trace: root process");
  for (const name of tracked) printStatus(name);

  const nodeScript = `const keys=${JSON.stringify([...tracked])};const out={};for(const k of keys){out[k]=Boolean(process.env[k]&&String(process.env[k]).trim())};console.log(JSON.stringify(out));`;
  const childNode = childSnapshot("node", ["-e", nodeScript]);
  console.log("\n## env trace: child node process");
  if (!childNode.ok) {
    console.log(`- unavailable: ${childNode.error}`);
  } else {
    for (const name of tracked)
      console.log(`- ${name}: ${childNode.data[name] ? "present" : "missing"}`);
  }

  const pnpmNode = childSnapshot("pnpm", ["exec", "node", "-e", nodeScript]);
  console.log("\n## env trace: pnpm subprocess");
  if (!pnpmNode.ok) {
    console.log(`- unavailable: ${pnpmNode.error}`);
  } else {
    for (const name of tracked)
      console.log(`- ${name}: ${pnpmNode.data[name] ? "present" : "missing"}`);
  }

  const turboConfig = JSON.parse(readFileSync(new URL("../turbo.json", import.meta.url), "utf8"));
  const turboEnv = new Set(
    Object.values(turboConfig.tasks || {}).flatMap((task) =>
      Array.isArray(task.env) ? task.env : []
    )
  );
  console.log("\n## env trace: turbo env allowlist coverage");
  for (const name of tracked) {
    const state = turboEnv.has(name) ? "tracked" : "not-tracked";
    console.log(`- ${name}: ${state}`);
  }
}

const mode = process.argv[2] || "required";
if (mode === "required") runRequiredCheck();
else if (mode === "parity") runParityCheck();
else if (mode === "trace") runTrace();
else if (mode === "ownership") runOwnershipCheck();
else {
  console.error("Usage: node scripts/verify-env-contract.mjs [required|parity|trace|ownership]");
  process.exit(1);
}
