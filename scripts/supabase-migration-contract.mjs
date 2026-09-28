#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const FILE_PATTERN = /^\d{14}_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
const MAX_MIGRATION_BYTES = 500_000;
const LEDGER_SCHEMA = "settler_internal";
const LEDGER_TABLE = "supabase_migrations";

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function withoutDollarQuotedBodies(sql) {
  return sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, "$$body$$");
}

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function validateMigration(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const filename = path.basename(absolutePath);
  const errors = [];

  if (!FILE_PATTERN.test(filename)) {
    errors.push("filename must match YYYYMMDDHHMMSS_lower_snake_case.sql");
  }

  const size = statSync(absolutePath).size;
  if (size === 0) errors.push("migration is empty");
  if (size > MAX_MIGRATION_BYTES) {
    errors.push(`migration exceeds the ${MAX_MIGRATION_BYTES}-byte Management API limit`);
  }

  const content = readFileSync(absolutePath, "utf8");
  const executableSql = withoutDollarQuotedBodies(content)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*--.*$/gm, "");

  if (!content.endsWith("\n")) errors.push("migration must end with a newline");
  if (/^\s*\\/m.test(content)) errors.push("psql meta-commands are not deployable SQL");
  if (/\b(?:BEGIN|COMMIT|ROLLBACK)\s*;/i.test(executableSql)) {
    errors.push("top-level transaction control is forbidden; the deployer owns the transaction");
  }
  if (/\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/i.test(executableSql)) {
    errors.push("CREATE INDEX CONCURRENTLY cannot run in the deployer's atomic transaction");
  }
  if (/\b(?:TODO|FIXME|YOUR_PASSWORD|PROJECT_REF)\b/i.test(content)) {
    errors.push("migration contains a placeholder marker");
  }

  const destructive = /\b(?:DROP\s+(?:TABLE|SCHEMA|COLUMN|TYPE)|TRUNCATE\s+TABLE)\b/i.test(
    executableSql
  );
  if (destructive && !/^-- settler: allow-destructive .+/m.test(content)) {
    errors.push("destructive SQL requires '-- settler: allow-destructive <reason>'");
  }

  if (/\bSECURITY\s+DEFINER\b/i.test(executableSql)) {
    if (!/\bSET\s+search_path\s*=/i.test(executableSql)) {
      errors.push("SECURITY DEFINER functions must set an explicit search_path");
    }
    if (!/\bREVOKE\s+(?:ALL|EXECUTE)[\s\S]+?FROM\s+PUBLIC\b/i.test(executableSql)) {
      errors.push("SECURITY DEFINER functions must revoke PUBLIC execution");
    }
  }

  if (/\bCREATE\s+(?:OR\s+REPLACE\s+)?VIEW\b/i.test(executableSql)) {
    if (!/security_invoker\s*=\s*true/i.test(executableSql)) {
      errors.push("views must use security_invoker = true");
    }
  }

  const version = filename.slice(0, 14);
  for (const sibling of options.catalogFiles ?? []) {
    const siblingName = path.basename(sibling);
    if (siblingName !== filename && siblingName.startsWith(`${version}_`)) {
      errors.push(`migration version ${version} is already used by ${siblingName}`);
    }
  }

  return { file: filePath, filename, bytes: size, checksum: sha256(content), errors };
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};
  const files = [];

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value.startsWith("--")) {
      const name = value.slice(2);
      const next = rest[index + 1];
      if (!next || next.startsWith("--")) throw new Error(`Missing value for ${value}`);
      options[name] = next;
      index += 1;
    } else {
      files.push(value);
    }
  }

  return { command, options, files };
}

function runSupabase(projectRef, args) {
  const result = spawnSync(
    "supabase",
    ["db", "query", "--linked", "--project-ref", projectRef, ...args],
    {
      encoding: "utf8",
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
      shell: process.platform === "win32",
    }
  );
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(output.trim() || `Supabase CLI exited ${result.status}`);
  return output;
}

function ledgerSetupSql() {
  return `
create schema if not exists ${LEDGER_SCHEMA};
revoke all on schema ${LEDGER_SCHEMA} from public, anon, authenticated;
create table if not exists ${LEDGER_SCHEMA}.${LEDGER_TABLE} (
  migration_name text primary key,
  sha256 char(64) not null,
  commit_sha text not null,
  applied_at timestamptz not null default clock_timestamp()
);
alter table ${LEDGER_SCHEMA}.${LEDGER_TABLE} enable row level security;
revoke all on table ${LEDGER_SCHEMA}.${LEDGER_TABLE} from public, anon, authenticated;
`;
}

function migrationStateSql(filename, checksum) {
  return `
select case
  when sha256 = ${sqlLiteral(checksum)} then 'SETTLER_APPLIED_MATCH'
  else 'SETTLER_APPLIED_MISMATCH'
end as migration_state
from ${LEDGER_SCHEMA}.${LEDGER_TABLE}
where migration_name = ${sqlLiteral(filename)}
union all
select 'SETTLER_PENDING'
where not exists (
  select 1 from ${LEDGER_SCHEMA}.${LEDGER_TABLE}
  where migration_name = ${sqlLiteral(filename)}
);
`;
}

function wrappedMigrationSql(content, filename, checksum, commitSha) {
  return `begin;
select pg_advisory_xact_lock(hashtextextended('settler:supabase:migrations', 0));
do $settler_guard$
begin
  if exists (
    select 1 from ${LEDGER_SCHEMA}.${LEDGER_TABLE}
    where migration_name = ${sqlLiteral(filename)}
  ) then
    raise exception 'Migration % is already recorded', ${sqlLiteral(filename)};
  end if;
end
$settler_guard$;

${content.trimEnd()}

insert into ${LEDGER_SCHEMA}.${LEDGER_TABLE} (migration_name, sha256, commit_sha)
values (${sqlLiteral(filename)}, ${sqlLiteral(checksum)}, ${sqlLiteral(commitSha)});
commit;
`;
}

function writeEvidence(filePath, evidence) {
  if (!filePath) return;
  const absolutePath = path.resolve(filePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

function validateFiles(files) {
  if (files.length === 0) throw new Error("At least one migration file is required");
  const catalogFiles = Array.from(
    new Set([
      ...files,
      ...files.flatMap((file) => {
        const directory = path.dirname(path.resolve(file));
        return readdirSync(directory)
          .filter((name) => name.endsWith(".sql"))
          .map((name) => path.join(directory, name));
      }),
    ])
  );
  const results = [...files]
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)))
    .map((file) => validateMigration(file, { catalogFiles }));
  const failed = results.filter((result) => result.errors.length > 0);

  for (const result of results) {
    if (result.errors.length === 0) {
      console.log(`✓ ${result.filename} (${result.checksum.slice(0, 12)})`);
    } else {
      for (const error of result.errors) console.error(`ERROR ${result.filename}: ${error}`);
    }
  }

  if (failed.length > 0) throw new Error(`${failed.length} migration file(s) violate the contract`);
  return results;
}

async function main() {
  const { command, options, files } = parseArguments(process.argv.slice(2));

  if (command === "validate") {
    validateFiles(files);
    return;
  }

  if (command !== "deploy") {
    throw new Error(
      "Usage: supabase-migration-contract.mjs <validate|deploy> [options] <migration.sql...>"
    );
  }

  const projectRef = options["project-ref"];
  const commitSha = options["commit-sha"];
  if (!projectRef || !/^[a-z]{20}$/.test(projectRef)) throw new Error("Invalid --project-ref");
  if (!commitSha || !/^[a-f0-9]{7,64}$/i.test(commitSha)) throw new Error("Invalid --commit-sha");
  if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN is required");

  const validated = validateFiles(files);
  const evidence = {
    schemaVersion: 1,
    projectRef,
    commitSha,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "running",
    migrations: [],
  };

  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "settler-migrations-"));
  try {
    runSupabase(projectRef, [ledgerSetupSql()]);

    for (const migration of validated) {
      const stateOutput = runSupabase(projectRef, [
        migrationStateSql(migration.filename, migration.checksum),
      ]);
      if (stateOutput.includes("SETTLER_APPLIED_MISMATCH")) {
        throw new Error(`Checksum mismatch for previously applied migration ${migration.filename}`);
      }
      if (stateOutput.includes("SETTLER_APPLIED_MATCH")) {
        console.log(`↷ ${migration.filename} already applied with matching checksum`);
        evidence.migrations.push({ ...migration, errors: undefined, status: "already_applied" });
        continue;
      }
      if (!stateOutput.includes("SETTLER_PENDING")) {
        throw new Error(`Could not determine ledger state for ${migration.filename}`);
      }

      const source = readFileSync(path.resolve(migration.file), "utf8");
      const wrappedPath = path.join(temporaryDirectory, migration.filename);
      writeFileSync(
        wrappedPath,
        wrappedMigrationSql(source, migration.filename, migration.checksum, commitSha),
        "utf8"
      );
      runSupabase(projectRef, ["--file", wrappedPath]);
      console.log(`✓ ${migration.filename} applied and recorded atomically`);
      evidence.migrations.push({ ...migration, errors: undefined, status: "applied" });
    }

    evidence.status = "success";
  } catch (error) {
    evidence.status = "failed";
    evidence.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    evidence.completedAt = new Date().toISOString();
    writeEvidence(options.evidence, evidence);
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
