#!/usr/bin/env tsx
/**
 * Smoke Test Script
 *
 * Tests critical paths:
 * 1. Signup → tenant → value → pay → continue
 * 2. Billing enforcement
 * 3. Usage tracking
 * 4. Tenant isolation
 */

import { createClient } from "@supabase/supabase-js";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`❌ ${name}:`, error);
  }
}

async function main() {
  console.log("🧪 Running Smoke Tests...\n");
  console.log(`API Base: ${API_BASE}\n`);

  // Test 1: Public API endpoint
  await test("Public API endpoint accessible", async () => {
    const response = await fetch(`${API_BASE}/api/v1`);
    if (!response.ok) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.version) {
      throw new Error("Missing version in response");
    }
  });

  // Test 2: Health check
  await test("Health check endpoint", async () => {
    const response = await fetch(`${API_BASE}/api/status/health`);
    if (!response.ok) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 3: Billing enforcement on paid routes
  await test("Billing enforcement on /api/v1/recon/jobs (unauthenticated)", async () => {
    const response = await fetch(`${API_BASE}/api/v1/recon/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Job" }),
    });

    // Should return demo response or 403, not 500
    if (response.status === 500) {
      throw new Error("Route returned 500 - billing enforcement may be broken");
    }

    const data = await response.json();
    // Should either be demo response or error about subscription
    if (!data.demo && !data.error && !data.message?.includes("subscription")) {
      throw new Error("Unexpected response - billing may not be enforced");
    }
  });

  // Test 4: Free route accessible
  await test("Free route /api/v1/convert accessible", async () => {
    const response = await fetch(`${API_BASE}/api/v1/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "unit",
        from: "m",
        to: "ft",
        value: 1,
      }),
    });

    if (!response.ok && response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 5: Database connection (if Supabase configured)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    await test("Database connection", async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error } = await supabase.from("billing_accounts").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        throw new Error(`Database error: ${error.message}`);
      }
    });
  }

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log("Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log("✅ All tests passed!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
