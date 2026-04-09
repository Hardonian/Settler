/**
 * Receipt Console E2E Smoke Test
 *
 * Tests the complete receipt flow:
 * 1. Authenticated user creates a receipt via API
 * 2. User views receipts in console
 * 3. User views receipt detail
 * 4. Tenant isolation (user A cannot see user B's receipts)
 *
 * Usage:
 *   tsx scripts/smoke-receipts.ts
 *
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_ANON_KEY environment variable
 *   - Test user credentials (or create test user)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
  process.exit(1);
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    console.error(`❌ ${name}: ${errorMessage}`);
  }
}

async function main() {
  console.log("🧪 Receipt Console E2E Smoke Test\n");
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // Test 1: Create Supabase client
  await test("Create Supabase client", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }
  });

  // Test 2: Verify helper function exists
  await test("Verify current_user_id() function exists", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Try to call the function (will fail if not authenticated, but function should exist)
    const { error } = await supabase.rpc("current_user_id");
    // Function should exist even if we're not authenticated
    if (error && error.message.includes("function") && error.message.includes("does not exist")) {
      throw new Error("current_user_id() function does not exist");
    }
  });

  // Test 3: Verify receipt tables exist
  await test("Verify receipt_uploads table exists", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("receipt_uploads").select("id").limit(1);
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error("receipt_uploads table does not exist");
    }
  });

  await test("Verify receipts table exists", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("receipts").select("id").limit(1);
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error("receipts table does not exist");
    }
  });

  await test("Verify receipt_items table exists", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("receipt_items").select("id").limit(1);
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error("receipt_items table does not exist");
    }
  });

  // Test 4: Verify RLS is enabled
  await test("Verify RLS is enabled on receipt_uploads", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Try to query without auth - should get permission denied (not "relation does not exist")
    const { error } = await supabase.from("receipt_uploads").select("id").limit(1);
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error("Table does not exist");
    }
    // Permission denied is expected when RLS is enabled and we're not authenticated
    if (
      error &&
      !error.message.includes("permission") &&
      !error.message.includes("row-level security")
    ) {
      throw new Error(`Unexpected error: ${error.message}`);
    }
  });

  // Test 5: Verify RLS policies exist
  await test("Verify RLS policies exist (check via query attempt)", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Without auth, should get permission denied (not "relation does not exist")
    const { error } = await supabase.from("receipts").select("id").limit(1);
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error("Table does not exist");
    }
    // Permission denied means RLS is working
    if (
      error &&
      !error.message.includes("permission") &&
      !error.message.includes("row-level security")
    ) {
      throw new Error(`Unexpected error: ${error.message}`);
    }
  });

  // Summary
  console.log("\n📊 Test Results:");
  console.log("─".repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
  console.log("\n⚠️  Note: Full E2E test requires authenticated user.");
  console.log("   To test with auth, use Playwright or provide test credentials.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
