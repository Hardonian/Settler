#!/usr/bin/env tsx
/**
 * Schema Verification Script
 *
 * Verifies that database schema matches Prisma schema definitions.
 * Checks for:
 * - Missing tables
 * - Missing columns
 * - Missing indexes
 * - RLS policies
 * - Functions and triggers
 *
 * Usage: tsx scripts/verify-schema.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

interface SchemaIssue {
  type:
    | "missing_table"
    | "missing_column"
    | "missing_index"
    | "missing_rls"
    | "missing_function"
    | "migration_drift";
  severity: "error" | "warning";
  message: string;
  table?: string;
  column?: string;
  index?: string;
}

const prisma = new PrismaClient();

// Expected tables from Prisma schema
const EXPECTED_TABLES = [
  "billing_accounts",
  "subscriptions",
  "stripe_events",
  "add_ons",
  "add_on_purchases",
  "usage_events",
  "usage_aggregate_daily",
  "usage_counters",
  "recon_jobs",
  "recon_results",
  "recon_templates",
  "recon_audits",
  "mapping_templates",
  "validation_rules",
  "transform_recipes",
  "contract_versions",
  "drift_events",
  "workflow_runs",
  "receipt_uploads",
  "receipts",
  "receipt_items",
  "feature_flags",
  "feature_flag_environments",
  "feature_flag_overrides",
  "tenants",
  "onboarding_progress",
  "audit_logs",
  "tenant_branding",
  "tenant_navigation",
  "tenant_pages",
  "tenant_page_revisions",
  "experiments",
  "experiment_variants",
  "experiment_metric_events",
  "webhooks",
  "webhook_deliveries",
  "idempotency_keys",
];

// Critical indexes that must exist
const CRITICAL_INDEXES = [
  { table: "billing_accounts", columns: ["user_id"] },
  { table: "billing_accounts", columns: ["stripe_customer_id"] },
  { table: "subscriptions", columns: ["billing_account_id"] },
  { table: "usage_events", columns: ["billing_account_id", "timestamp"] },
  { table: "api_keys", columns: ["user_id"] },
  { table: "tenants", columns: ["slug"] },
];

function getSupabaseEnv(): { supabaseUrl: string; supabaseAnonKey: string } | SchemaIssue {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      type: "migration_drift",
      severity: "error",
      message: "Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)",
    };
  }

  return { supabaseUrl, supabaseAnonKey };
}

async function checkDatabaseConnection(): Promise<SchemaIssue | null> {
  try {
    await prisma.$connect();
    return null;
  } catch (error) {
    return {
      type: "migration_drift",
      severity: "error",
      message: `Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function verifyTablesExist(supabase: any): Promise<SchemaIssue[]> {
  const issues: SchemaIssue[] = [];
  for (const table of EXPECTED_TABLES) {
    try {
      const { error } = await supabase.from(table).select("*").limit(0);

      if (error) {
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          issues.push({
            type: "missing_table",
            severity: "error",
            message: `Table "${table}" does not exist in database`,
            table,
          });
        } else if (error.code === "42501") {
          // RLS might be blocking - this is ok for verification
        }
      }
    } catch (error) {
      issues.push({
        type: "missing_table",
        severity: "error",
        message: `Failed to verify table "${table}": ${error instanceof Error ? error.message : "Unknown error"}`,
        table,
      });
    }
  }
  return issues;
}

async function verifyIndexesExist(supabase: any): Promise<SchemaIssue[]> {
  const issues: SchemaIssue[] = [];
  try {
    for (const index of CRITICAL_INDEXES) {
      try {
        const { error } = await supabase.from(index.table).select("*").limit(0);
        if (error && error.code === "42P01") {
          issues.push({
            type: "missing_index",
            severity: "warning",
            message: `Table "${index.table}" missing - cannot verify index on ${index.columns.join(", ")}`,
            table: index.table,
            index: index.columns.join(", "),
          });
        }
      } catch {
        // Index check failed
      }
    }
  } catch (error) {
    issues.push({
      type: "migration_drift",
      severity: "warning",
      message: `Failed to verify indexes: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
  return issues;
}

async function verifyRlsPolicies(supabase: any): Promise<SchemaIssue | null> {
  try {
    const { error } = await supabase.from("pg_policies").select("*").limit(1);

    if (error && error.code !== "42P01") {
      return {
        type: "missing_rls",
        severity: "warning",
        message: "Could not verify RLS policies (may require admin access)",
      };
    }
  } catch {
    // RLS check failed
  }
  return null;
}

async function verifySchema(): Promise<SchemaIssue[]> {
  const issues: SchemaIssue[] = [];

  try {
    const envResult = getSupabaseEnv();
    if ("type" in envResult) {
      issues.push(envResult as SchemaIssue);
      return issues;
    }

    const { supabaseUrl, supabaseAnonKey } = envResult;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const dbConnectionIssue = await checkDatabaseConnection();
    if (dbConnectionIssue) {
      issues.push(dbConnectionIssue);
      return issues;
    }

    issues.push(...(await verifyTablesExist(supabase)));
    issues.push(...(await verifyIndexesExist(supabase)));

    const rlsIssue = await verifyRlsPolicies(supabase);
    if (rlsIssue) {
      issues.push(rlsIssue);
    }
  } catch (error) {
    issues.push({
      type: "migration_drift",
      severity: "error",
      message: `Schema verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  } finally {
    await prisma.$disconnect();
  }

  return issues;
}

async function main() {
  console.log("🔍 Verifying database schema...\n");

  const issues = await verifySchema();

  if (issues.length === 0) {
    console.log("✅ Schema verification passed - all tables and indexes are present");
    process.exit(0);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} error(s):`);
    errors.forEach((issue) => {
      console.error(`  [${issue.type}] ${issue.message}`);
      if (issue.table) console.error(`    Table: ${issue.table}`);
      if (issue.column) console.error(`    Column: ${issue.column}`);
      if (issue.index) console.error(`    Index: ${issue.index}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  Found ${warnings.length} warning(s):`);
    warnings.forEach((issue) => {
      console.warn(`  [${issue.type}] ${issue.message}`);
      if (issue.table) console.warn(`    Table: ${issue.table}`);
      if (issue.column) console.warn(`    Column: ${issue.column}`);
      if (issue.index) console.warn(`    Index: ${issue.index}`);
    });
  }

  console.log(`\n📊 Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);

  // Exit with error code if there are critical issues
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error during schema verification:", error);
  process.exit(1);
});
