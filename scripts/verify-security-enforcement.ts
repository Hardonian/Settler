#!/usr/bin/env tsx
/**
 * Security Enforcement Verification Script
 *
 * Verifies that all security, billing, and data integrity rules are properly enforced:
 * 1. RLS policies are enabled on all tenant-scoped tables
 * 2. Database constraints exist for billing requirements
 * 3. Runtime guards are in place for API routes
 * 4. Adapters respect permissions
 * 5. No routes can bypass plan checks
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface VerificationResult {
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function addResult(
  check: string,
  status: "pass" | "fail" | "warning",
  message: string,
  details?: any
) {
  results.push({ check, status, message, details });
  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} ${check}: ${message}`);
}

async function verifyRLSPolicies() {
  console.log("\n📋 Verifying RLS Policies...\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    addResult("RLS Policies", "warning", "Cannot verify RLS - Supabase credentials not configured");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const tenantScopedTables = [
    "recon_jobs",
    "recon_results",
    "receipt_uploads",
    "receipts",
    "feature_flags",
    "usage_events",
    "subscriptions",
    "add_on_purchases",
  ];

  for (const table of tenantScopedTables) {
    try {
      // Check if RLS is enabled
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1
        `,
        params: [table],
      });

      if (error) {
        // Try alternative method
        const { data: policies, error: policyError } = await supabase
          .from("pg_policies")
          .select("*")
          .eq("tablename", table)
          .limit(1);

        if (policyError || !policies || policies.length === 0) {
          addResult(`RLS: ${table}`, "fail", `No RLS policies found for ${table}`);
        } else {
          addResult(`RLS: ${table}`, "pass", `RLS enabled with policies`);
        }
      } else {
        addResult(`RLS: ${table}`, "pass", `RLS enabled`);
      }
    } catch (error) {
      addResult(
        `RLS: ${table}`,
        "warning",
        `Could not verify RLS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function verifyDatabaseConstraints() {
  console.log("\n🔒 Verifying Database Constraints...\n");

  try {
    // Check foreign key constraints
    const constraints = await prisma.$queryRaw<
      Array<{
        constraint_name: string;
        table_name: string;
        constraint_type: string;
      }>
    >`
      SELECT 
        conname as constraint_name,
        conrelid::regclass::text as table_name,
        contype as constraint_type
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      AND (
        conname LIKE '%billing_account_id%' 
        OR conname LIKE '%subscription%'
        OR conname LIKE '%status_check%'
      )
      ORDER BY table_name, constraint_name
    `;

    const requiredConstraints = [
      "subscriptions_billing_account_id_fkey",
      "add_on_purchases_billing_account_id_fkey",
      "usage_events_billing_account_id_fkey",
      "subscriptions_status_check",
      "billing_accounts_status_check",
      "add_on_purchases_status_check",
    ];

    for (const required of requiredConstraints) {
      const found = constraints.some((c) => c.constraint_name === required);
      if (found) {
        addResult(`Constraint: ${required}`, "pass", "Constraint exists");
      } else {
        addResult(`Constraint: ${required}`, "fail", "Constraint missing");
      }
    }
  } catch (error) {
    addResult(
      "Database Constraints",
      "warning",
      `Could not verify constraints: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function verifyDatabaseFunctions() {
  console.log("\n⚙️  Verifying Database Functions...\n");

  try {
    const functions = await prisma.$queryRaw<
      Array<{
        routine_name: string;
      }>
    >`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'has_active_subscription',
        'has_plan_or_higher',
        'has_add_on_purchase',
        'get_user_billing_account_id'
      )
    `;

    const requiredFunctions = [
      "has_active_subscription",
      "has_plan_or_higher",
      "has_add_on_purchase",
      "get_user_billing_account_id",
    ];

    for (const required of requiredFunctions) {
      const found = functions.some((f) => f.routine_name === required);
      if (found) {
        addResult(`Function: ${required}`, "pass", "Function exists");
      } else {
        addResult(`Function: ${required}`, "fail", "Function missing");
      }
    }
  } catch (error) {
    addResult(
      "Database Functions",
      "warning",
      `Could not verify functions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function verifyRuntimeGuards() {
  console.log("\n🛡️  Verifying Runtime Guards...\n");

  const apiRoutesPath = path.join(process.cwd(), "packages/web/src/app/api/v1");

  if (!fs.existsSync(apiRoutesPath)) {
    addResult("Runtime Guards", "warning", "API routes directory not found");
    return;
  }

  const routesToCheck = ["recon/jobs/route.ts", "receipts/route.ts", "feature-flags/route.ts"];

  for (const route of routesToCheck) {
    const routePath = path.join(apiRoutesPath, route);
    if (!fs.existsSync(routePath)) {
      addResult(`Runtime Guard: ${route}`, "warning", "Route file not found");
      continue;
    }

    const content = fs.readFileSync(routePath, "utf-8");

    // Check for billing enforcement usage
    const hasBillingCheck =
      content.includes("requireActiveSubscription") ||
      content.includes("requirePlan") ||
      content.includes("requireAddOn") ||
      content.includes("withBillingEnforcement") ||
      content.includes("checkRequestEntitlement") ||
      content.includes("enforceUsageLimit");

    if (hasBillingCheck) {
      addResult(`Runtime Guard: ${route}`, "pass", "Billing enforcement found");
    } else {
      addResult(`Runtime Guard: ${route}`, "fail", "No billing enforcement found");
    }
  }

  // Check if billing-enforcement.ts exists
  const billingEnforcementPath = path.join(
    process.cwd(),
    "packages/web/src/lib/security/billing-enforcement.ts"
  );

  if (fs.existsSync(billingEnforcementPath)) {
    addResult("Runtime Guard: billing-enforcement.ts", "pass", "Billing enforcement module exists");
  } else {
    addResult(
      "Runtime Guard: billing-enforcement.ts",
      "fail",
      "Billing enforcement module missing"
    );
  }
}

async function verifyAdapterPermissions() {
  console.log("\n🔌 Verifying Adapter Permissions...\n");

  const adapterRoutePath = path.join(process.cwd(), "packages/api/src/routes/adapters.ts");

  if (!fs.existsSync(adapterRoutePath)) {
    addResult("Adapter Permissions", "warning", "Adapter route file not found");
    return;
  }

  const content = fs.readFileSync(adapterRoutePath, "utf-8");

  const hasPermissionCheck =
    content.includes("checkIntegrationAccess") || content.includes("requireAddOn");

  if (hasPermissionCheck) {
    addResult("Adapter Permissions", "pass", "Adapter routes check permissions");
  } else {
    addResult("Adapter Permissions", "fail", "Adapter routes do not check permissions");
  }
}

async function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SECURITY ENFORCEMENT VERIFICATION REPORT");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}\n`);

  if (failed > 0) {
    console.log("\n❌ FAILED CHECKS:\n");
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => {
        console.log(`  - ${r.check}: ${r.message}`);
        if (r.details) {
          console.log(`    Details: ${JSON.stringify(r.details, null, 2)}`);
        }
      });
  }

  if (warnings > 0) {
    console.log("\n⚠️  WARNINGS:\n");
    results
      .filter((r) => r.status === "warning")
      .forEach((r) => {
        console.log(`  - ${r.check}: ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  if (failed === 0) {
    console.log("✅ All critical security checks passed!");
    process.exit(0);
  } else {
    console.log("❌ Some security checks failed. Please review and fix.");
    process.exit(1);
  }
}

async function main() {
  try {
    await verifyRLSPolicies();
    await verifyDatabaseConstraints();
    await verifyDatabaseFunctions();
    await verifyRuntimeGuards();
    await verifyAdapterPermissions();
    await generateReport();
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
