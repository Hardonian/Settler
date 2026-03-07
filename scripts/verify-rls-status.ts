#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const repoRoot = process.cwd();
const outputPath =
  process.env.RLS_STATUS_OUTPUT ||
  path.join(repoRoot, "artifacts", "security", "rls-status-latest.json");

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL");
  process.exit(1);
}

const criticalTables = [
  "billing_accounts",
  "subscriptions",
  "usage_events",
  "recon_jobs",
  "recon_results",
  "normalized_transactions",
  "reconciliation_runs",
  "reconciliation_matches",
  "receipt_uploads",
  "receipts",
  "feature_flags",
  "tenants",
];

async function countWithTenant(pool: Pool, tenantId: string, sql: string) {
  await pool.query("BEGIN");
  try {
    await pool.query("SELECT set_config('request.jwt.claim.tenant_id', $1, true)", [tenantId]);
    const result = await pool.query(sql);
    await pool.query("ROLLBACK");
    return Number(result.rows[0]?.count || 0);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function verifyRLS() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : false,
  });

  const report: any = {
    generatedAt: new Date().toISOString(),
    status: "passed",
    criticalTables: [],
    policyPresence: { totalChecked: 0, missingRls: [], missingPolicies: [] },
    runtimeHarness: {
      executed: false,
      fixtures: {
        schema: "settler_security",
        table: "rls_runtime_probe",
        tenants: ["tenant_A", "tenant_B"],
      },
      allowDenyMatrix: {},
      errors: [],
    },
  };

  try {
    await pool.query("SELECT 1");

    for (const table of criticalTables) {
      const rlsCheck = await pool.query(
        `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
        [table]
      );
      if (rlsCheck.rows.length === 0) continue;

      const policyCheck = await pool.query(
        `SELECT COUNT(*)::int AS count FROM pg_policies WHERE schemaname = 'public' AND tablename = $1`,
        [table]
      );
      const row = {
        table,
        rlsEnabled: Boolean(rlsCheck.rows[0].rowsecurity),
        policies: Number(policyCheck.rows[0].count),
      };
      report.criticalTables.push(row);
      report.policyPresence.totalChecked += 1;
      if (!row.rlsEnabled) report.policyPresence.missingRls.push(table);
      if (row.policies === 0) report.policyPresence.missingPolicies.push(table);
    }

    // Runtime harness in isolated schema.
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS settler_security;
      CREATE TABLE IF NOT EXISTS settler_security.rls_runtime_probe (
        id serial PRIMARY KEY,
        tenant_id text NOT NULL,
        payload text NOT NULL
      );
      ALTER TABLE settler_security.rls_runtime_probe ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS tenant_isolation_probe ON settler_security.rls_runtime_probe;
      CREATE POLICY tenant_isolation_probe ON settler_security.rls_runtime_probe
      USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true))
      WITH CHECK (tenant_id = current_setting('request.jwt.claim.tenant_id', true));
      DELETE FROM settler_security.rls_runtime_probe;
      INSERT INTO settler_security.rls_runtime_probe (tenant_id, payload)
      VALUES ('tenant_A', 'alpha'), ('tenant_B', 'beta');
    `);

    report.runtimeHarness.executed = true;

    const sameTenant = await countWithTenant(
      pool,
      "tenant_A",
      "SELECT COUNT(*)::int AS count FROM settler_security.rls_runtime_probe WHERE tenant_id = 'tenant_A'"
    );
    const crossTenant = await countWithTenant(
      pool,
      "tenant_A",
      "SELECT COUNT(*)::int AS count FROM settler_security.rls_runtime_probe WHERE tenant_id = 'tenant_B'"
    );

    const unauthorized = await pool.query(
      "SELECT COUNT(*)::int AS count FROM settler_security.rls_runtime_probe"
    );

    report.runtimeHarness.allowDenyMatrix = {
      sameTenantAllow: sameTenant >= 1,
      crossTenantDeny: crossTenant === 0,
      anonymousDeny: Number(unauthorized.rows[0].count) === 0,
    };

    const matrix = report.runtimeHarness.allowDenyMatrix;
    if (!matrix.sameTenantAllow || !matrix.crossTenantDeny || !matrix.anonymousDeny) {
      report.status = "failed";
    }

    if (
      report.policyPresence.missingRls.length > 0 ||
      report.policyPresence.missingPolicies.length > 0
    ) {
      report.status = "failed";
    }

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(report, null, 2));

    if (report.status !== "passed") {
      console.error("❌ RLS verification failed.");
      process.exit(1);
    }

    console.log("✅ RLS verification passed.");
    console.log(`Report: ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    report.status = "failed";
    report.runtimeHarness.errors.push(error instanceof Error ? error.message : String(error));
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.error(
      "❌ Verification failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyRLS();
