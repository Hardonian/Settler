#!/usr/bin/env node
/**
 * Verify Supabase migration files against the migration contract
 * (scripts/supabase-migration-contract.mjs) before they are committed.
 *
 * Default scope: staged supabase/migrations/*.sql files (the pre-commit hook's
 * intent). Pass --all to validate every top-level migration instead, or pass
 * explicit file paths.
 *
 * Duplicate-version detection runs against the full top-level catalog either
 * way. Archived migrations (supabase/migrations/_archive/) are out of scope.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { validateMigration } from "./supabase-migration-contract.mjs";

const args = process.argv.slice(2);
const all = args.includes("--all");
const explicit = args.filter((a) => !a.startsWith("--"));

const MIG_DIR = "supabase/migrations";
const catalogFiles = readdirSync(MIG_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => path.join(MIG_DIR, f));

let targets;
if (explicit.length) {
  targets = explicit;
} else if (all) {
  targets = catalogFiles;
} else {
  const out = execFileSync("git", ["diff", "--cached", "--name-only", "--", `${MIG_DIR}/*.sql`], {
    encoding: "utf8",
  });
  targets = out.split("\n").filter((l) => l.trim());
}

if (!targets.length) {
  console.log("verify-migrations: no migration files in scope");
  process.exit(0);
}

let failed = 0;
for (const file of targets) {
  const result = validateMigration(file, { catalogFiles });
  if (result.errors.length) {
    failed++;
    console.error(`FAIL ${file}`);
    for (const e of result.errors) console.error(`     - ${e}`);
  } else {
    console.log(`PASS ${file} (sha256 ${result.checksum.slice(0, 12)}…)`);
  }
}

if (failed) {
  console.error(
    `verify-migrations: ${failed}/${targets.length} file(s) failed the migration contract`
  );
  process.exit(1);
}
console.log(`verify-migrations: ${targets.length} file(s) pass`);
