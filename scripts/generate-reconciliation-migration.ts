#!/usr/bin/env tsx
/**
 * Generate Reconciliation Migration
 *
 * Analyzes verification results and generates an idempotent SQL migration
 * to reconcile differences between expected and live database state.
 *
 * Usage: tsx scripts/generate-reconciliation-migration.ts [verification-results.json]
 */

import * as fs from "fs";
import * as path from "path";

interface VerificationResult {
  component: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

class ReconciliationMigrationGenerator {
  private results: VerificationResult[];
  private migrationSQL: string[] = [];

  constructor(resultsPath: string) {
    const resultsData = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
    this.results = resultsData.results || [];
  }

  generate(): string {
    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- BACKEND CONTRACT RECONCILIATION MIGRATION");
    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- Generated from backend verification results");
    this.migrationSQL.push(`-- Generated at: ${new Date().toISOString()}`);
    this.migrationSQL.push("--");
    this.migrationSQL.push("-- This migration is idempotent and safe to run multiple times.");
    this.migrationSQL.push(
      "-- It reconciles differences between expected and live database state."
    );
    this.migrationSQL.push(
      "-- ============================================================================\n"
    );

    this.migrationSQL.push("BEGIN;\n");

    // Group results by component type
    const failures = this.results.filter((r) => r.status === "fail");

    const missingExtensions = failures.filter((r) => r.component.startsWith("extension."));
    const missingTables = failures.filter((r) => r.component.startsWith("table."));
    const missingIndexes = failures.filter((r) => r.component.startsWith("index."));
    const missingConstraints = failures.filter((r) => r.component.startsWith("constraint."));
    const rlsIssues = failures.filter((r) => r.component.startsWith("rls."));
    const missingFunctions = failures.filter((r) => r.component.startsWith("function."));

    // Generate SQL for each category
    this.generateExtensionSQL(missingExtensions);
    this.generateTableSQL(missingTables);
    this.generateIndexSQL(missingIndexes);
    this.generateConstraintSQL(missingConstraints);
    this.generateRLSSQL(rlsIssues);
    this.generateFunctionSQL(missingFunctions);

    this.migrationSQL.push("\nCOMMIT;");

    return this.migrationSQL.join("\n");
  }

  private generateExtensionSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- EXTENSIONS");
    this.migrationSQL.push(
      "-- ============================================================================\n"
    );

    for (const issue of issues) {
      const extName = issue.component.replace("extension.", "");
      this.migrationSQL.push(`CREATE EXTENSION IF NOT EXISTS "${extName}";`);
    }

    this.migrationSQL.push("");
  }

  private generateTableSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- TABLES");
    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- NOTE: Table creation requires manual review.");
    this.migrationSQL.push("-- Tables should be created from the golden schema migration.");
    this.migrationSQL.push("-- This section is a placeholder - review and implement manually.\n");

    for (const issue of issues) {
      const tableName = issue.component.replace("table.", "");
      this.migrationSQL.push(`-- Missing table: ${tableName}`);
      this.migrationSQL.push(`-- TODO: Create table ${tableName} from golden schema`);
    }

    this.migrationSQL.push("");
  }

  private generateIndexSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- INDEXES");
    this.migrationSQL.push(
      "-- ============================================================================\n"
    );

    for (const issue of issues) {
      const parts = issue.component.split(".");
      if (parts.length >= 3) {
        const table = parts[1];
        const columns = parts.slice(2).join("_").replace(/_/g, ", ");

        // Extract column names from message if available
        const columnMatch = issue.message.match(/\(([^)]+)\)/);
        const columnList = columnMatch ? columnMatch[1] : columns;

        const indexName = `idx_${table}_${columns.replace(/, /g, "_")}`;
        this.migrationSQL.push(
          `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${columnList});`
        );
      }
    }

    this.migrationSQL.push("");
  }

  private generateConstraintSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- CONSTRAINTS");
    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- NOTE: Constraint creation requires careful review.");
    this.migrationSQL.push("-- Ensure existing data is valid before adding constraints.\n");

    for (const issue of issues) {
      const parts = issue.component.split(".");
      if (parts.length >= 3) {
        const table = parts[1];
        const constraintType = parts[2];

        this.migrationSQL.push(`-- Missing ${constraintType} on ${table}`);
        this.migrationSQL.push(`-- TODO: Add ${constraintType} constraint - review golden schema`);
      }
    }

    this.migrationSQL.push("");
  }

  private generateRLSSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- ROW LEVEL SECURITY");
    this.migrationSQL.push(
      "-- ============================================================================\n"
    );

    for (const issue of issues) {
      const parts = issue.component.split(".");
      if (parts.length >= 3) {
        const schema = parts[1];
        const table = parts[2];
        const fullTable = `${schema}.${table}`;

        if (issue.message.includes("RLS not enabled")) {
          this.migrationSQL.push(`ALTER TABLE ${fullTable} ENABLE ROW LEVEL SECURITY;`);
        } else if (issue.message.includes("no policies found")) {
          this.migrationSQL.push(`-- Generating standard tenant isolation policies for ${fullTable}`);

          this.migrationSQL.push(`DROP POLICY IF EXISTS tenant_select ON ${fullTable};`);
          this.migrationSQL.push(`CREATE POLICY tenant_select ON ${fullTable}`);
          this.migrationSQL.push(`  FOR SELECT`);
          this.migrationSQL.push(`  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))));`);

          this.migrationSQL.push(`DROP POLICY IF EXISTS tenant_insert ON ${fullTable};`);
          this.migrationSQL.push(`CREATE POLICY tenant_insert ON ${fullTable}`);
          this.migrationSQL.push(`  FOR INSERT`);
          this.migrationSQL.push(`  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));`);

          this.migrationSQL.push(`DROP POLICY IF EXISTS tenant_update ON ${fullTable};`);
          this.migrationSQL.push(`CREATE POLICY tenant_update ON ${fullTable}`);
          this.migrationSQL.push(`  FOR UPDATE`);
          this.migrationSQL.push(`  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))`);
          this.migrationSQL.push(`  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));`);

          this.migrationSQL.push(`DROP POLICY IF EXISTS tenant_delete ON ${fullTable};`);
          this.migrationSQL.push(`CREATE POLICY tenant_delete ON ${fullTable}`);
          this.migrationSQL.push(`  FOR DELETE`);
          this.migrationSQL.push(`  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));`);
        }
      }
    }

    this.migrationSQL.push("");
  }

  private generateFunctionSQL(issues: VerificationResult[]) {
    if (issues.length === 0) return;

    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- FUNCTIONS");
    this.migrationSQL.push(
      "-- ============================================================================"
    );
    this.migrationSQL.push("-- NOTE: Function creation requires manual review.");
    this.migrationSQL.push("-- Functions should be created from migration files.\n");

    for (const issue of issues) {
      const funcName = issue.component.replace("function.", "");
      this.migrationSQL.push(`-- Missing function: ${funcName}`);
      this.migrationSQL.push(`-- TODO: Create function ${funcName} from migration files`);
    }

    this.migrationSQL.push("");
  }
}

async function main() {
  const resultsPath =
    process.argv[2] || path.join(__dirname, "../supabase/backend-verification-results.json");

  if (!fs.existsSync(resultsPath)) {
    console.error(`Error: Verification results file not found: ${resultsPath}`);
    console.error("Run: tsx scripts/verify-backend-contract.ts first");
    process.exit(1);
  }

  try {
    const generator = new ReconciliationMigrationGenerator(resultsPath);
    const migrationSQL = generator.generate();

    // Generate migration filename with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
    const migrationName = `${timestamp}_backend_contract_reconcile.sql`;
    const migrationPath = path.join(__dirname, "../supabase/migrations", migrationName);

    fs.writeFileSync(migrationPath, migrationSQL);

    console.log(`✅ Generated reconciliation migration: ${migrationPath}`);
    console.log("\n⚠️  IMPORTANT: Review the migration before applying!");
    console.log("   Some sections require manual implementation (tables, functions).");
    console.log(`   Apply with: supabase db push\n`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
