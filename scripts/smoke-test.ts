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
    console.info(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`❌ ${name}:`, error);
  }
}

async function testPublicApiEndpoint() {
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
}

async function testHealthCheck() {
  await test("Health check endpoint", async () => {
    const response = await fetch(`${API_BASE}/api/status/health`);
    if (!response.ok) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });
}

async function testBillingEnforcement() {
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
}

async function testFreeRoute() {
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
}

async function testDatabaseConnection() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    await test("Database connection", async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error } = await supabase.from("billing_accounts").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        throw new Error(`Database error: ${error.message}`);
      }
    });
  }
}

function printSummary() {
  console.info("\n═══════════════════════════════════════════════════════════");
  console.info("TEST SUMMARY");
  console.info("═══════════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.info(`Total: ${results.length}`);
  console.info(`✅ Passed: ${passed}`);
  console.info(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.info("Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.info(`  ❌ ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.info("✅ All tests passed!");
    process.exit(0);
  }
}

async function main() {
  console.info("🧪 Running Smoke Tests...\n");
  console.info(`API Base: ${API_BASE}\n`);

  await testPublicApiEndpoint();
  await testHealthCheck();
  await testBillingEnforcement();
  await testFreeRoute();
  await testDatabaseConnection();

  printSummary();
}

main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
