#!/usr/bin/env node
/**
 * verify-migration-catalog.mjs
 *
 * Permanent drift monitor for the two migration catalogs:
 *   1. supabase/migrations/*.sql  <->  supabase_migrations.schema_migrations (live ledger)
 *   2. prisma/migrations/ (dirs)  <->  _prisma_migrations (live ledger)
 *
 * A migration file that is not recorded in the remote ledger means the live
 * database cannot be provisioned to match the repository, and a ledger row
 * without a file means history was rewritten. Both are drift; the check exits 1
 * and names the offenders. Exit 0 prints both counts.
 *
 * Usage: DATABASE_URL=postgres://... node scripts/verify-migration-catalog.mjs
 * (DATABASE_URL falls back to .env.local in the repo root.)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require2 = createRequire(path.join(process.cwd(), "package.json"));
const pg = require2("pg");

const envLocal = fs.existsSync(path.join(process.cwd(), ".env.local"))
  ? fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
  : "";
const envGet = (k) =>
  process.env[k] || (envLocal.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();

const url = envGet("DATABASE_URL");
if (!url) {
  console.error("verify-migration-catalog: DATABASE_URL is not configured");
  process.exit(2);
}

function localSupabaseVersions() {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const seen = new Map();
  for (const f of files) {
    const v = f.split("_")[0];
    if (seen.has(v)) {
      console.error(
        `❌ duplicate migration version ${v}: ${seen.get(v)} and ${f} (ledger stores one row per version)`
      );
      process.exit(1);
    }
    seen.set(v, f);
  }
  return [...seen.keys()].sort();
}

function localPrismaVersions() {
  const dir = path.join(process.cwd(), "prisma", "migrations");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name.split("_")[0])
    .sort();
}

const client = new pg.Client({ connectionString: url });
let drift = 0;
try {
  await client.connect();

  const sbLocal = localSupabaseVersions();
  const sbRemote = (
    await client.query(
      "select version::text as v from supabase_migrations.schema_migrations order by version"
    )
  ).rows.map((r) => r.v);

  const prLocal = localPrismaVersions();
  const prRemote = (
    await client.query("select migration_name as v from _prisma_migrations order by migration_name")
  ).rows.map((r) => r.v.split("_")[0]);

  const compare = (label, local, remote) => {
    const l = new Set(local);
    const r = new Set(remote);
    const missingInLedger = [...l].filter((v) => !r.has(v)).sort();
    const missingOnDisk = [...r].filter((v) => !l.has(v)).sort();
    console.log(`\n${label}: ${local.length} file(s) vs ${remote.length} ledger row(s)`);
    if (missingInLedger.length) {
      drift += missingInLedger.length;
      console.error(`  ❌ recorded nowhere in ledger: ${missingInLedger.join(", ")}`);
    }
    if (missingOnDisk.length) {
      drift += missingOnDisk.length;
      console.error(`  ❌ ledger row without a file on disk: ${missingOnDisk.join(", ")}`);
    }
    if (!missingInLedger.length && !missingOnDisk.length) {
      console.log("  ✅ in sync");
    }
  };

  compare("supabase/migrations <-> supabase_migrations.schema_migrations", sbLocal, sbRemote);
  compare("prisma/migrations <-> _prisma_migrations", prLocal, prRemote);

  if (drift > 0) {
    console.error(`\n❌ migration catalog drift: ${drift} offender(s)`);
    process.exit(1);
  }
  console.log("\n✅ migration catalogs in sync");
} catch (e) {
  console.error("verify-migration-catalog failed:", e.message);
  process.exit(2);
} finally {
  await client.end().catch(() => {});
}
