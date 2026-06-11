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
      this.migrationSQL.push(`-- ACTION REQUIRED: Create table ${tableName} from golden schema`);
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
        this.migrationSQL.push(
          `-- ACTION REQUIRED: Add ${constraintType} constraint - review golden schema`
        );
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
          this.migrationSQL.push(`-- RLS enabled but no policies on ${fullTable}`);
          this.migrationSQL.push(`-- ACTION REQUIRED: Add RLS policies - review golden schema`);
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
    this.migrationSQL.push(
      "-- NOTE: Functions are automatically extracted from previous migrations.\n"
    );

    for (const issue of issues) {
      const funcName = issue.component.replace("function.", "");
      const sql = this.extractFunctionSQL(funcName);

      if (sql) {
        this.migrationSQL.push(`-- Re-creating missing function: ${funcName}`);
        this.migrationSQL.push(sql);
      } else {
        this.migrationSQL.push(`-- Missing function: ${funcName}`);
        this.migrationSQL.push(
          `-- ACTION REQUIRED: Create function ${funcName} (definition not found in migrations)`
        );
      }
    }

    this.migrationSQL.push("");
  }

  private extractFunctionSQL(funcName: string): string | null {
    const migrationsDir = path.join(__dirname, "../supabase/migrations");
    if (!fs.existsSync(migrationsDir)) return null;

    // Read files and sort newest first to get the most recent definition
    const files = fs.readdirSync(migrationsDir).sort((a, b) => b.localeCompare(a));

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      // Attempt to find the CREATE FUNCTION block
      // Functions are generally defined like: CREATE OR REPLACE FUNCTION public.my_func
      const startPattern = `(?:CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(?:public\\.)?${funcName}\\b)`;

      // PostgreSQL functions usually enclose the body in dollar quotes, like AS $ ... $ or AS $func$ ... $func$
      // We'll capture the start pattern, optionally some attributes, the AS keyword, the dollar quote marker,
      // the body content up to the matching dollar quote marker, and the final semicolon.
      const dollarQuoteRegex = new RegExp(
        `(${startPattern}[\\s\\S]*?AS\\s+(\\$\\w*\\$)[\\s\\S]*?\\2[\\s\\S]*?;)`,
        "i"
      );

      let match = content.match(dollarQuoteRegex);
      if (match) {
        return match[1].trim() + "\n";
      }

      // If it doesn't use dollar quotes (e.g., standard SQL functions returning values directly
      // or using single quotes which is rare but possible), we'll do a fallback greedy match
      // up to the LANGUAGE declaration and semicolon, assuming no internal dollar quotes.
      const simpleRegex = new RegExp(`(${startPattern}[\\s\\S]*?LANGUAGE\\s+\\w+[\\s\\S]*?;)`, "i");

      match = content.match(simpleRegex);
      if (match) {
        return match[1].trim() + "\n";
      }
    }

    return null;
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
    console.log("   Some sections require manual implementation (tables).");
    console.log(`   Apply with: supabase db push\n`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
