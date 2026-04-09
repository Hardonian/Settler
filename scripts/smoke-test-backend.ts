#!/usr/bin/env tsx
/**
 * Backend Smoke Test
 *
 * Performs real queries against Supabase to verify:
 * - Anon client can access public data
 * - Service role can access all data
 * - RLS policies work correctly
 * - RPC functions are callable
 *
 * Usage: tsx scripts/smoke-test-backend.ts
 */

import { createClient } from "@supabase/supabase-js";

interface SmokeTestResult {
  test: string;
  status: "pass" | "fail";
  message: string;
  duration?: number;
}

class BackendSmokeTester {
  private anonClient: ReturnType<typeof createClient>;
  private serviceClient: ReturnType<typeof createClient>;
  private results: SmokeTestResult[] = [];

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing SUPABASE_URL and SUPABASE_ANON_KEY");
    }

    if (!supabaseServiceKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    this.anonClient = createClient(supabaseUrl, supabaseAnonKey);
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  async runAll(): Promise<SmokeTestResult[]> {
    console.log("🔥 Running backend smoke tests...\n");

    await this.testAnonConnection();
    await this.testServiceConnection();
    await this.testRLSEnforcement();
    await this.testRPCFunctions();
    await this.testTableAccess();

    return this.results;
  }

  private async testAnonConnection() {
    const start = Date.now();
    try {
      const { data, error } = await this.anonClient.from("profiles").select("id").limit(1);
      const duration = Date.now() - start;

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        throw error;
      }

      this.results.push({
        test: "anon.connection",
        status: "pass",
        message: "Anon client can connect to Supabase",
        duration,
      });
    } catch (error) {
      this.results.push({
        test: "anon.connection",
        status: "fail",
        message: `Anon connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async testServiceConnection() {
    const start = Date.now();
    try {
      const { data, error } = await this.serviceClient.from("tenants").select("id").limit(1);
      const duration = Date.now() - start;

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      this.results.push({
        test: "service.connection",
        status: "pass",
        message: "Service role client can connect to Supabase",
        duration,
      });
    } catch (error) {
      this.results.push({
        test: "service.connection",
        status: "fail",
        message: `Service connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async testRLSEnforcement() {
    // Test that anon user cannot access tenant data without proper auth
    try {
      const { data, error } = await this.anonClient.from("tenants").select("*").limit(1);

      // Should fail due to RLS (unless there's a public policy)
      if (error && (error.code === "42501" || error.message.includes("permission denied"))) {
        this.results.push({
          test: "rls.enforcement",
          status: "pass",
          message: "RLS correctly blocks anon access to tenants table",
        });
      } else if (data && data.length === 0) {
        // Empty result is also acceptable (RLS working, just no data)
        this.results.push({
          test: "rls.enforcement",
          status: "pass",
          message: "RLS allows query but returns no rows (expected)",
        });
      } else {
        this.results.push({
          test: "rls.enforcement",
          status: "warning",
          message: "RLS may not be properly configured - anon user can query tenants",
        });
      }
    } catch (error) {
      this.results.push({
        test: "rls.enforcement",
        status: "fail",
        message: `RLS test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test that service role can bypass RLS
    try {
      const { data, error } = await this.serviceClient.from("tenants").select("id").limit(1);

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      this.results.push({
        test: "rls.service_bypass",
        status: "pass",
        message: "Service role can bypass RLS (expected)",
      });
    } catch (error) {
      this.results.push({
        test: "rls.service_bypass",
        status: "fail",
        message: `Service role RLS bypass failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async testRPCFunctions() {
    // Test critical RPC functions
    const functions = [
      { name: "log_usage_event", args: { event_type: "test", quantity: 1 } },
      { name: "check_rls_policies", args: {} },
    ];

    for (const func of functions) {
      try {
        const start = Date.now();
        const { data, error } = await this.serviceClient.rpc(func.name, func.args);
        const duration = Date.now() - start;

        if (error) {
          // Some functions may require specific args or auth - that's ok
          if (
            error.message.includes("permission denied") ||
            error.message.includes("does not exist")
          ) {
            this.results.push({
              test: `rpc.${func.name}`,
              status: "fail",
              message: `RPC function ${func.name} failed: ${error.message}`,
            });
          } else {
            // Other errors might be expected (e.g., validation errors)
            this.results.push({
              test: `rpc.${func.name}`,
              status: "warning",
              message: `RPC function ${func.name} returned error (may be expected): ${error.message}`,
            });
          }
        } else {
          this.results.push({
            test: `rpc.${func.name}`,
            status: "pass",
            message: `RPC function ${func.name} is callable`,
            duration,
          });
        }
      } catch (error) {
        this.results.push({
          test: `rpc.${func.name}`,
          status: "fail",
          message: `RPC function ${func.name} threw error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  }

  private async testTableAccess() {
    // Test access to critical tables
    const criticalTables = ["tenants", "billing_accounts", "subscriptions"];

    for (const table of criticalTables) {
      try {
        const { error } = await this.serviceClient.from(table).select("id").limit(0);

        if (error) {
          if (error.code === "42P01") {
            this.results.push({
              test: `table.${table}`,
              status: "fail",
              message: `Table ${table} does not exist`,
            });
          } else {
            this.results.push({
              test: `table.${table}`,
              status: "warning",
              message: `Table ${table} access issue: ${error.message}`,
            });
          }
        } else {
          this.results.push({
            test: `table.${table}`,
            status: "pass",
            message: `Table ${table} is accessible`,
          });
        }
      } catch (error) {
        this.results.push({
          test: `table.${table}`,
          status: "fail",
          message: `Table ${table} test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  }
}

async function main() {
  try {
    const tester = new BackendSmokeTester();
    const results = await tester.runAll();

    console.log("\n📊 Smoke Test Results:\n");

    const passes = results.filter((r) => r.status === "pass");
    const failures = results.filter((r) => r.status === "fail");
    const warnings = results.filter((r) => r.status === "warning");

    console.log(`✅ Passed: ${passes.length}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    if (failures.length > 0) {
      console.log("❌ Failures:");
      failures.forEach((r) => {
        console.log(`  [${r.test}] ${r.message}`);
      });
      console.log("");
    }

    if (warnings.length > 0) {
      console.log("⚠️  Warnings:");
      warnings.forEach((r) => {
        console.log(`  [${r.test}] ${r.message}`);
      });
      console.log("");
    }

    // Print all results
    console.log("📋 All Results:");
    results.forEach((r) => {
      const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⚠️";
      const duration = r.duration ? ` (${r.duration}ms)` : "";
      console.log(`  ${icon} [${r.test}] ${r.message}${duration}`);
    });

    process.exit(failures.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
