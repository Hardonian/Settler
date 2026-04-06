#!/usr/bin/env node
/**
 * Pilot / evaluation evidence index: optional DB snapshot of operator-customization and related audit rows.
 * Requires DATABASE_URL. Safe read-only counts + sample audit actions (no PII export).
 * For full run/proofpack correlation, use CLI `requiem:prove` / existing proofpack workflows when configured.
 */
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        code: "database_url_missing",
        message: "Set DATABASE_URL to emit a pilot evidence index from the database.",
      },
      null,
      2
    )
  );
  process.exit(0);
}

const tables = [
  "operator_customization_states",
  "operator_customization_proposals",
  "operator_customization_audits",
  "operator_suggestion_dismissals",
  "operator_interaction_signals",
];

async function main() {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8000 });
  await client.connect();
  const out = { ok: true, generatedAt: new Date().toISOString(), tables: {}, auditActionSamples: [] };

  for (const t of tables) {
    const r = await client.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists`,
      [t]
    );
    const exists = r.rows[0]?.exists === true;
    if (!exists) {
      out.tables[t] = { exists: false, count: null, code: "table_missing_migrate_first" };
      continue;
    }
    const c = await client.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
    out.tables[t] = { exists: true, count: c.rows[0]?.n ?? null };
  }

  if (out.tables.operator_customization_audits?.exists) {
    const actions = await client.query(
      `SELECT action, COUNT(*)::int AS n FROM operator_customization_audits GROUP BY action ORDER BY n DESC LIMIT 20`
    );
    out.auditActionSamples = actions.rows;
  }

  await client.end();
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, code: "query_failed", message: String(e.message) }, null, 2));
  process.exit(1);
});
