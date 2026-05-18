import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

type ObjectKind = "table" | "type" | "function" | "trigger" | "policy" | "index" | "view";

type ExpectedObject = {
  kind: ObjectKind;
  schema: string;
  name: string;
  source: string;
};

type Finding = ExpectedObject & {
  status: "present" | "missing";
};

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const REPORT_JSON = path.join(process.cwd(), "reports", "supabase-schema-reality-report.json");
const REPORT_MD = path.join(process.cwd(), "reports", "supabase-schema-reality-report.md");

function parseExpectedObjects(filePath: string, sql: string): ExpectedObject[] {
  const source = path.relative(process.cwd(), filePath);
  const out: ExpectedObject[] = [];

  const pushMatches = (regex: RegExp, kind: ObjectKind, schemaDefault = "public") => {
    for (const m of sql.matchAll(regex)) {
      const qname = (m[1] || "").replace(/"/g, "");
      if (!qname) continue;
      const [schema, name] = qname.includes(".") ? qname.split(".") : [schemaDefault, qname];
      out.push({ kind, schema, name, source });
    }
  };

  pushMatches(/create\s+table\s+if\s+not\s+exists\s+([a-zA-Z0-9_."]+)/gim, "table");
  pushMatches(/create\s+table\s+([a-zA-Z0-9_."]+)/gim, "table");
  pushMatches(/create\s+type\s+([a-zA-Z0-9_."]+)\s+as\s+enum/gim, "type");
  pushMatches(/create\s+or\s+replace\s+function\s+([a-zA-Z0-9_."]+)\s*\(/gim, "function");
  pushMatches(/create\s+function\s+([a-zA-Z0-9_."]+)\s*\(/gim, "function");
  pushMatches(/create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+([a-zA-Z0-9_."]+)/gim, "index");
  pushMatches(/create\s+(?:unique\s+)?index\s+([a-zA-Z0-9_."]+)/gim, "index");
  pushMatches(/create\s+trigger\s+([a-zA-Z0-9_."]+)/gim, "trigger");
  pushMatches(/create\s+policy\s+"?([^"\n]+)"?\s+on\s+([a-zA-Z0-9_."]+)/gim, "policy");
  pushMatches(/create\s+or\s+replace\s+view\s+([a-zA-Z0-9_."]+)/gim, "view");

  return out
    .filter((o) => !o.name.startsWith("pg_") && o.name !== "schema_migrations")
    .map((o) => ({ ...o, name: o.name.trim() }));
}

async function exists(client: Client, obj: ExpectedObject): Promise<boolean> {
  switch (obj.kind) {
    case "table": {
      const r = await client.query(
        `select 1 from information_schema.tables where table_schema = $1 and table_name = $2`,
        [obj.schema, obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "type": {
      const r = await client.query(
        `select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = $1 and t.typname = $2`,
        [obj.schema, obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "function": {
      const r = await client.query(
        `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = $1 and p.proname = $2`,
        [obj.schema, obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "index": {
      const r = await client.query(
        `select 1 from pg_indexes where schemaname = $1 and indexname = $2`,
        [obj.schema, obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "trigger": {
      const r = await client.query(
        `select 1 from pg_trigger where tgname = $1 and not tgisinternal`,
        [obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "view": {
      const r = await client.query(
        `select 1 from information_schema.views where table_schema = $1 and table_name = $2`,
        [obj.schema, obj.name]
      );
      return (r.rowCount ?? 0) > 0;
    }
    case "policy": {
      const r = await client.query(`select 1 from pg_policies where policyname = $1`, [obj.name]);
      return (r.rowCount ?? 0) > 0;
    }
    default:
      return false;
  }
}


function getMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(
      (f) =>
        f.endsWith(".sql") &&
        ![
          "INTROSPECTION.sql",
          "GAPS_REPORT.sql",
          "PATCH.sql",
          "VERIFY.sql",
          "ROLLBACK.sql",
        ].includes(f)
    )
    .sort()
    .map((f) => path.join(MIGRATIONS_DIR, f));
}

function getExpectedObjects(files: string[]): ExpectedObject[] {
  const expected: ExpectedObject[] = [];
  for (const file of files) {
    expected.push(...parseExpectedObjects(file, fs.readFileSync(file, "utf8")));
  }

  const dedup = new Map<string, ExpectedObject>();
  for (const item of expected) {
    dedup.set(`${item.kind}:${item.schema}:${item.name}`, item);
  }
  return [...dedup.values()];
}

async function getDatabaseIdentity(client: Client) {
  const id = await client.query(
    `select current_database() as database, current_user as user, inet_server_addr()::text as server_addr, inet_server_port() as server_port, version()`
  );
  return id.rows[0];
}

async function getAppliedMigrationVersions(client: Client): Promise<string[]> {
  const migrationsTable = await client.query(`
    select exists (
      select 1 from information_schema.tables where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
    ) as exists
  `);

  let appliedVersions: string[] = [];
  if (migrationsTable.rows[0]?.exists) {
    const versions = await client.query(
      `select version from supabase_migrations.schema_migrations order by version`
    );
    appliedVersions = versions.rows.map((r) => String(r.version));
  }
  return appliedVersions;
}

async function findFindings(client: Client, expectedUnique: ExpectedObject[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const obj of expectedUnique) {
    const present = await exists(client, obj);
    findings.push({ ...obj, status: present ? "present" : "missing" });
  }
  return findings;
}

function writeReports(
  databaseIdentity: any,
  files: string[],
  appliedVersions: string[],
  findings: Finding[],
  missing: Finding[]
) {
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        databaseIdentity,
        migrationFiles: files.map((f) => path.relative(process.cwd(), f)),
        appliedMigrationVersions: appliedVersions,
        summary: {
          expectedObjectCount: findings.length,
          missingObjectCount: missing.length,
        },
        missing,
      },
      null,
      2
    )
  );

  const byFile = new Map<string, Finding[]>();
  for (const item of missing) {
    byFile.set(item.source, [...(byFile.get(item.source) || []), item]);
  }

  const lines: string[] = [];
  lines.push("# Supabase Schema Reality Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Connected Database");
  lines.push(`- Database: ${databaseIdentity.database}`);
  lines.push(`- User: ${databaseIdentity.user}`);
  lines.push(
    `- Server: ${databaseIdentity.server_addr ?? "unknown"}:${databaseIdentity.server_port ?? "unknown"}`
  );
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Expected objects parsed from repo migrations: ${findings.length}`);
  lines.push(`- Missing objects in live DB: ${missing.length}`);
  lines.push(`- Supabase migration ledger entries: ${appliedVersions.length}`);
  lines.push("");

  lines.push("## Missing Objects by Migration");
  if (missing.length === 0) {
    lines.push("- None.");
  } else {
    for (const [source, items] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`- ${source}`);
      for (const item of items.sort((a, b) =>
        `${a.kind}:${a.name}`.localeCompare(`${b.kind}:${b.name}`)
      )) {
        lines.push(`  - ${item.kind}: ${item.schema}.${item.name}`);
      }
    }
  }
  lines.push("");

  fs.writeFileSync(REPORT_MD, lines.join("\n"));

  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD)}`);
  console.log(`Missing objects: ${missing.length}`);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error("Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL");
  }

  const files = getMigrationFiles();
  const expectedUnique = getExpectedObjects(files);

  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const databaseIdentity = await getDatabaseIdentity(client);
  const appliedVersions = await getAppliedMigrationVersions(client);
  const findings = await findFindings(client, expectedUnique);

  await client.end();

  const missing = findings.filter((f) => f.status === "missing");

  writeReports(databaseIdentity, files, appliedVersions, findings, missing);
}

main().catch((error) => {
  console.error("supabase-schema-reality-audit failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
