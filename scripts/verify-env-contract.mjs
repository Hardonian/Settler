#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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
else {
  console.error("Usage: node scripts/verify-env-contract.mjs [required|parity|trace]");
  process.exit(1);
}
