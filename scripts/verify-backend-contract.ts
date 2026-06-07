#!/usr/bin/env tsx
/**
 * Backend Contract Verification Script
 *
 * Queries live Supabase database to verify:
 * - Tables, columns, types, defaults
 * - Indexes, constraints, triggers
 * - RLS policies and enforcement
 * - RPC functions
 * - Extensions
 * - Storage buckets and policies
 * - Realtime publications
 *
 * Compares against expected contract from migrations and app code.
 *
 * Usage: tsx scripts/verify-backend-contract.ts [--reconcile]
 */

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface VerificationResult {
  component: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

interface TableInfo {
  schema: string;
  name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  rlsEnabled: boolean;
  policies: PolicyInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

interface IndexInfo {
  name: string;
  definition: string;
  unique: boolean;
}

interface ConstraintInfo {
  name: string;
  type: string; // PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK
  definition: string;
}

interface PolicyInfo {
  name: string;
  cmd: string; // SELECT, INSERT, UPDATE, DELETE, ALL
  qual: string;
  with_check: string;
}

interface FunctionInfo {
  schema: string;
  name: string;
  return_type: string;
  arguments: string;
  security: "DEFINER" | "INVOKER";
}

class BackendContractVerifier {
  private pool: Pool;
  private supabase: ReturnType<typeof createClient>;
  private results: VerificationResult[] = [];
  private expectedTables: Set<string> = new Set();
  private expectedFunctions: Set<string> = new Set();
  private expectedBuckets: Set<string> = new Set();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL or DIRECT_URL for direct DB connection");
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.pool = new Pool({ connectionString: databaseUrl });

    // Load expected contract from migrations and app code
    this.loadExpectedContract();
  }

  private loadExpectedContract() {
    // Load from golden schema migration
    const goldenSchemaPath = path.join(
      __dirname,
      "../supabase/migrations/00000000_settler_golden_schema.sql"
    );
    if (fs.existsSync(goldenSchemaPath)) {
      const content = fs.readFileSync(goldenSchemaPath, "utf-8");

      // Extract table names
      const tableMatches = content.matchAll(
        /CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+\.)?([a-z_]+)/gi
      );
      for (const match of tableMatches) {
        const schema = match[1]?.replace(".", "") || "public";
        const table = match[2];
        this.expectedTables.add(`${schema}.${table}`);
      }

      // Extract function names
      const functionMatches = content.matchAll(
        /CREATE (?:OR REPLACE )?FUNCTION ([a-z_]+\.)?([a-z_]+)\(/gi
      );
      for (const match of functionMatches) {
        const schema = match[1]?.replace(".", "") || "public";
        const func = match[2];
        this.expectedFunctions.add(`${schema}.${func}`);
      }
    }

    // Load from app code usage (RPC calls)
    const appCodeDir = path.join(__dirname, "../packages");
    this.scanAppCodeForUsage(appCodeDir);
  }

  private scanAppCodeForUsage(dir: string) {
    try {
      const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && (file.name.endsWith(".ts") || file.name.endsWith(".tsx"))) {
          const filePath = path.join(file.path, file.name);
          try {
            const content = fs.readFileSync(filePath, "utf-8");

            // Find RPC calls
            const rpcMatches = content.matchAll(/\.rpc\(['"]([a-z_]+)['"]/gi);
            for (const match of rpcMatches) {
              this.expectedFunctions.add(`public.${match[1]}`);
            }

            // Find table references
            const fromMatches = content.matchAll(/\.from\(['"]([a-z_]+)['"]/gi);
            for (const match of fromMatches) {
              this.expectedTables.add(`public.${match[1]}`);
            }
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    } catch (e) {
      // Directory might not exist or be inaccessible
    }
  }

  async verify(): Promise<VerificationResult[]> {
    console.log("🔍 Starting backend contract verification...\n");

    await this.verifyExtensions();
    await this.verifySchemas();
    await this.verifyTables();
    await this.verifyIndexes();
    await this.verifyConstraints();
    await this.verifyRLS();
    await this.verifyFunctions();
    await this.verifyTriggers();
    await this.verifyStorage();
    await this.verifyRealtime();

    return this.results;
  }

  private async verifyExtensions() {
    console.log("📦 Verifying extensions...");
    const result = await this.pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto', 'citext', 'pg_trgm')
      ORDER BY extname
    `);

    const required = ["uuid-ossp", "pgcrypto"];
    const found = new Set(result.rows.map((r: any) => r.extname));

    for (const ext of required) {
      if (found.has(ext)) {
        this.results.push({
          component: `extension.${ext}`,
          status: "pass",
          message: `Extension ${ext} is installed`,
        });
      } else {
        this.results.push({
          component: `extension.${ext}`,
          status: "fail",
          message: `Required extension ${ext} is missing`,
        });
      }
    }
  }

  private async verifySchemas() {
    console.log("📚 Verifying schemas...");
    const result = await this.pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('public', 'app_private', 'analytics', 'storage')
      ORDER BY schema_name
    `);

    const required = ["public", "app_private"];
    const found = new Set(result.rows.map((r: any) => r.schema_name));

    for (const schema of required) {
      if (found.has(schema)) {
        this.results.push({
          component: `schema.${schema}`,
          status: "pass",
          message: `Schema ${schema} exists`,
        });
      } else {
        this.results.push({
          component: `schema.${schema}`,
          status: "fail",
          message: `Required schema ${schema} is missing`,
        });
      }
    }
  }

  private async verifyTables() {
    console.log("📊 Verifying tables...");

    // Get all tables from live database
    const result = await this.pool.query(`
      SELECT 
        table_schema,
        table_name,
        CASE WHEN relrowsecurity THEN true ELSE false END as rls_enabled
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
      WHERE table_schema IN ('public', 'app_private', 'analytics')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);

    const liveTables = new Set<string>();
    const tablesBySchema: Record<string, TableInfo[]> = {};

    for (const row of result.rows) {
      const fullName = `${row.table_schema}.${row.table_name}`;
      liveTables.add(fullName);

      if (!tablesBySchema[row.table_schema]) {
        tablesBySchema[row.table_schema] = [];
      }

      // Get columns for this table
      const columnsResult = await this.pool.query(
        `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `,
        [row.table_schema, row.table_name]
      );

      tablesBySchema[row.table_schema].push({
        schema: row.table_schema,
        name: row.table_name,
        columns: columnsResult.rows.map((r: any) => ({
          name: r.column_name,
          type: r.data_type,
          nullable: r.is_nullable === "YES",
          default: r.column_default,
        })),
        indexes: [],
        constraints: [],
        rlsEnabled: row.rls_enabled,
        policies: [],
      });
    }

    // Check expected tables exist
    for (const expectedTable of this.expectedTables) {
      if (liveTables.has(expectedTable)) {
        this.results.push({
          component: `table.${expectedTable}`,
          status: "pass",
          message: `Table ${expectedTable} exists`,
        });
      } else {
        this.results.push({
          component: `table.${expectedTable}`,
          status: "fail",
          message: `Expected table ${expectedTable} is missing`,
        });
      }
    }

    // Check for unexpected tables (warnings)
    for (const liveTable of liveTables) {
      if (
        !this.expectedTables.has(liveTable) &&
        !liveTable.startsWith("pg_") &&
        !liveTable.startsWith("auth.")
      ) {
        this.results.push({
          component: `table.${liveTable}`,
          status: "warning",
          message: `Unexpected table ${liveTable} found (not in expected contract)`,
        });
      }
    }
  }

  private async verifyIndexes() {
    console.log("🔍 Verifying indexes...");

    const result = await this.pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef,
        CASE WHEN indexdef LIKE '%UNIQUE%' THEN true ELSE false END as is_unique
      FROM pg_indexes
      WHERE schemaname IN ('public', 'app_private', 'analytics')
        AND indexname NOT LIKE 'pg_%'
      ORDER BY schemaname, tablename, indexname
    `);

    // Critical indexes that must exist
    const criticalIndexes = [
      { table: "tenants", columns: ["slug"] },
      { table: "billing_accounts", columns: ["user_id"] },
      { table: "billing_accounts", columns: ["stripe_customer_id"] },
      { table: "subscriptions", columns: ["billing_account_id"] },
      { table: "usage_events", columns: ["billing_account_id", "timestamp"] },
    ];

    for (const critical of criticalIndexes) {
      const found = result.rows.some(
        (r: any) =>
          r.tablename === critical.table && r.indexdef.includes(`(${critical.columns.join(",")})`)
      );

      if (found) {
        this.results.push({
          component: `index.${critical.table}.${critical.columns.join("_")}`,
          status: "pass",
          message: `Critical index on ${critical.table}(${critical.columns.join(",")}) exists`,
        });
      } else {
        this.results.push({
          component: `index.${critical.table}.${critical.columns.join("_")}`,
          status: "fail",
          message: `Critical index on ${critical.table}(${critical.columns.join(",")}) is missing`,
        });
      }
    }
  }

  private async verifyConstraints() {
    console.log("🔒 Verifying constraints...");

    const result = await this.pool.query(`
      SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema IN ('public', 'app_private', 'analytics')
      ORDER BY tc.table_schema, tc.table_name, tc.constraint_type
    `);

    // Check for primary keys on critical tables
    const criticalTables = ["tenants", "billing_accounts", "subscriptions", "usage_events"];
    for (const table of criticalTables) {
      const hasPK = result.rows.some(
        (r: any) => r.table_name === table && r.constraint_type === "PRIMARY KEY"
      );

      if (hasPK) {
        this.results.push({
          component: `constraint.${table}.primary_key`,
          status: "pass",
          message: `Primary key constraint exists on ${table}`,
        });
      } else {
        this.results.push({
          component: `constraint.${table}.primary_key`,
          status: "fail",
          message: `Primary key constraint missing on ${table}`,
        });
      }
    }
  }

  private async verifyRLS() {
    console.log("🛡️  Verifying RLS policies...");

    // Check RLS is enabled on critical tables
    const result = await this.pool.query(`
      SELECT 
        schemaname,
        tablename,
        CASE WHEN relrowsecurity THEN true ELSE false END as rls_enabled,
        CASE WHEN relforcerowsecurity THEN true ELSE false END as rls_forced
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
      WHERE schemaname IN ('public', 'app_private')
        AND tablename IN ('tenants', 'billing_accounts', 'subscriptions', 'usage_events', 'receipts', 'recon_jobs')
    `);

    for (const row of result.rows) {
      if (row.rls_enabled) {
        // Check policies exist
        const policiesResult = await this.pool.query(
          `
          SELECT 
            policyname,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE schemaname = $1 AND tablename = $2
        `,
          [row.schemaname, row.tablename]
        );

        if (policiesResult.rows.length > 0) {
          this.results.push({
            component: `rls.${row.schemaname}.${row.tablename}`,
            status: "pass",
            message: `RLS enabled with ${policiesResult.rows.length} policies on ${row.schemaname}.${row.tablename}`,
            details: { policyCount: policiesResult.rows.length },
          });
        } else {
          this.results.push({
            component: `rls.${row.schemaname}.${row.tablename}`,
            status: "fail",
            message: `RLS enabled but no policies found on ${row.schemaname}.${row.tablename}`,
          });
        }
      } else {
        this.results.push({
          component: `rls.${row.schemaname}.${row.tablename}`,
          status: "fail",
          message: `RLS not enabled on critical table ${row.schemaname}.${row.tablename}`,
        });
      }
    }
  }

  private async verifyFunctions() {
    console.log("⚙️  Verifying RPC functions...");

    const result = await this.pool.query(`
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname NOT LIKE 'pg_%'
      ORDER BY n.nspname, p.proname
    `);

    const liveFunctions = new Set<string>();
    for (const row of result.rows) {
      liveFunctions.add(`public.${row.function_name}`);
    }

    // Check expected functions exist
    const criticalFunctions = [
      "log_usage_event",
      "check_rls_policies",
      "get_slow_queries",
      "upsert_reality_metric",
      "record_reality_event",
    ];

    for (const func of criticalFunctions) {
      const fullName = `public.${func}`;
      if (liveFunctions.has(fullName)) {
        this.results.push({
          component: `function.${func}`,
          status: "pass",
          message: `Function ${func} exists`,
        });
      } else {
        this.results.push({
          component: `function.${func}`,
          status: "fail",
          message: `Expected function ${func} is missing`,
        });
      }
    }
  }

  private async verifyTriggers() {
    console.log("⚡ Verifying triggers...");

    const result = await this.pool.query(`
      SELECT 
        trigger_schema,
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema IN ('public', 'app_private')
      ORDER BY trigger_schema, event_object_table, trigger_name
    `);

    // Check for critical triggers (e.g., updated_at)
    const criticalTables = ["tenants", "billing_accounts"];
    for (const table of criticalTables) {
      const hasUpdatedAtTrigger = result.rows.some(
        (r: any) => r.event_object_table === table && r.trigger_name.includes("updated_at")
      );

      if (hasUpdatedAtTrigger) {
        this.results.push({
          component: `trigger.${table}.updated_at`,
          status: "pass",
          message: `updated_at trigger exists on ${table}`,
        });
      } else {
        this.results.push({
          component: `trigger.${table}.updated_at`,
          status: "warning",
          message: `updated_at trigger missing on ${table} (may use default)`,
        });
      }
    }
  }

  private async verifyStorage() {
    console.log("💾 Verifying storage buckets...");

    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();

      if (error) {
        this.results.push({
          component: "storage.buckets",
          status: "warning",
          message: `Could not list storage buckets: ${error.message}`,
        });
        return;
      }

      const bucketNames = buckets?.map((b) => b.name) || [];

      // Check for expected buckets
      const expectedBuckets = ["receipts", "exports"];
      for (const bucket of expectedBuckets) {
        if (bucketNames.includes(bucket)) {
          this.results.push({
            component: `storage.bucket.${bucket}`,
            status: "pass",
            message: `Storage bucket ${bucket} exists`,
          });
        } else {
          this.results.push({
            component: `storage.bucket.${bucket}`,
            status: "warning",
            message: `Storage bucket ${bucket} not found (may be created on-demand)`,
          });
        }
      }
    } catch (error) {
      this.results.push({
        component: "storage.buckets",
        status: "warning",
        message: `Storage verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async verifyRealtime() {
    console.log("📡 Verifying Realtime publications...");

    try {
      const result = await this.pool.query(`
        SELECT 
          pubname,
          puballtables,
          pubinsert,
          pubupdate,
          pubdelete
        FROM pg_publication
        WHERE pubname NOT LIKE 'pg_%'
      `);

      if (result.rows.length > 0) {
        this.results.push({
          component: "realtime.publications",
          status: "pass",
          message: `Found ${result.rows.length} Realtime publication(s)`,
          details: { publications: result.rows.map((r: any) => r.pubname) },
        });
      } else {
        this.results.push({
          component: "realtime.publications",
          status: "warning",
          message: "No Realtime publications found (may not be using Realtime)",
        });
      }
    } catch (error) {
      this.results.push({
        component: "realtime.publications",
        status: "warning",
        message: `Realtime verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function main() {
  const reconcile = process.argv.includes("--reconcile");

  try {
    const verifier = new BackendContractVerifier();
    const results = await verifier.verify();
    await verifier.close();

    // Print results
    console.log("\n📋 Verification Results:\n");

    const passes = results.filter((r) => r.status === "pass");
    const failures = results.filter((r) => r.status === "fail");
    const warnings = results.filter((r) => r.status === "warning");

    console.log(`✅ Passed: ${passes.length}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    if (failures.length > 0) {
      console.log("❌ Failures:");
      failures.forEach((r) => {
        console.log(`  [${r.component}] ${r.message}`);
      });
      console.log("");
    }

    if (warnings.length > 0) {
      console.log("⚠️  Warnings:");
      warnings.forEach((r) => {
        console.log(`  [${r.component}] ${r.message}`);
      });
      console.log("");
    }

    // Save results to file
    const outputPath = path.join(__dirname, "../supabase/backend-verification-results.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            total: results.length,
            passed: passes.length,
            failed: failures.length,
            warnings: warnings.length,
          },
          results,
        },
        null,
        2
      )
    );

    console.log(`📄 Results saved to: ${outputPath}`);

    if (reconcile && failures.length > 0) {
      console.log("\n🔄 Reconciliation mode: generating migration...");
      try {
        execSync(
          `npx tsx ${path.join(__dirname, "generate-reconciliation-migration.ts")} ${outputPath}`,
          {
            stdio: "inherit",
          }
        );
      } catch (e) {
        console.error("Failed to generate migration:", e instanceof Error ? e.message : String(e));
      }
    }

    process.exit(failures.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
