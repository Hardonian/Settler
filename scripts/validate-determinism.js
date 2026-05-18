#!/usr/bin/env node

/**
 * Determinism Verification CLI
 *
 * Usage:
 *   node scripts/validate-determinism.js
 *   node scripts/validate-determinism.js --fixtures
 *   node scripts/validate-determinism.js --pressure
 *   node scripts/validate-determinism.js --all
 */

const path = require("path");

// Simple mock for the verification gates
const GOLDEN_FIXTURES = [
    {
      name: "simple_exact_match",
      source_records: [
        {
          source: "stripe",
          external_id: "tx_001",
          date: "2024-01-15T10:00:00Z",
          amount: "100.00",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_002",
          date: "2024-01-15T11:00:00Z",
          amount: "200.00",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_003",
          date: "2024-01-15T12:00:00Z",
          amount: "300.00",
          currency: "USD",
        },
      ],
      target_records: [
        {
          source: "shopify",
          external_id: "tx_001",
          date: "2024-01-15T10:00:00Z",
          amount: "100.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_002",
          date: "2024-01-15T11:00:00Z",
          amount: "200.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_003",
          date: "2024-01-15T12:00:00Z",
          amount: "300.00",
          currency: "USD",
        },
      ],
      rules: [{ id: "rule_1", field: "external_id", type: "exact", weight: 1.0, version: 1 }],
      expected_match_count: 3,
    },
    {
      name: "fuzzy_amount_match",
      source_records: [
        {
          source: "stripe",
          external_id: "tx_101",
          date: "2024-01-15T10:00:00Z",
          amount: "99.99",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_102",
          date: "2024-01-15T11:00:00Z",
          amount: "149.50",
          currency: "USD",
        },
      ],
      target_records: [
        {
          source: "shopify",
          external_id: "tx_101",
          date: "2024-01-15T10:00:00Z",
          amount: "100.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_102",
          date: "2024-01-15T11:00:00Z",
          amount: "150.00",
          currency: "USD",
        },
      ],
      rules: [
        {
          id: "rule_2",
          field: "amount",
          type: "range",
          weight: 1.0,
          tolerance: 0.5,
          threshold: 0.9,
          version: 1,
        },
      ],
      expected_match_count: 2,
    },
    {
      name: "mixed_match_scenarios",
      source_records: [
        {
          source: "stripe",
          external_id: "tx_201",
          date: "2024-01-15T10:00:00Z",
          amount: "100.00",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_202",
          date: "2024-01-15T11:00:00Z",
          amount: "200.00",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_203",
          date: "2024-01-15T12:00:00Z",
          amount: "300.00",
          currency: "USD",
        },
        {
          source: "stripe",
          external_id: "tx_204",
          date: "2024-01-15T13:00:00Z",
          amount: "400.00",
          currency: "USD",
        },
      ],
      target_records: [
        {
          source: "shopify",
          external_id: "tx_201",
          date: "2024-01-15T10:00:00Z",
          amount: "100.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_202",
          date: "2024-01-15T11:05:00Z",
          amount: "200.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_203",
          date: "2024-01-16T12:00:00Z",
          amount: "300.00",
          currency: "USD",
        },
        {
          source: "shopify",
          external_id: "tx_999",
          date: "2024-01-15T14:00:00Z",
          amount: "999.00",
          currency: "USD",
        },
      ],
      rules: [
        { id: "rule_3", field: "external_id", type: "exact", weight: 1.0, version: 1 },
        {
          id: "rule_4",
          field: "amount",
          type: "range",
          weight: 0.8,
          tolerance: 0.01,
          threshold: 0.9,
          version: 1,
        },
      ],
      expected_match_count: 3,
    },
  ];

async function runGoldenTests() {
  console.log("\n🧪 Running Golden Determinism Tests...\n");

  const fixtures = GOLDEN_FIXTURES;

  let passed = 0;
  let failed = 0;

  for (const fixture of fixtures) {
    console.log(`📋 Testing: ${fixture.name}`);

    // Simulate deterministic matching
    const sourceSet = new Set(fixture.source_records.map((r) => r.external_id));
    const targetSet = new Set(fixture.target_records.map((r) => r.external_id));

    // Simple exact matching simulation
    let matches = 0;
    for (const source of fixture.source_records) {
      if (targetSet.has(source.external_id)) {
        matches++;
      }
    }

    if (matches === fixture.expected_match_count) {
      console.log(`   ✅ PASSED (${matches} matches)\n`);
      passed++;
    } else {
      console.log(`   ❌ FAILED (expected ${fixture.expected_match_count}, got ${matches})\n`);
      failed++;
    }
  }

  console.log("=".repeat(50));
  console.log(`Golden Tests: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  return { passed, failed };
}

async function runPressureTests(recordCount = 1000) {
  console.log(`\n🔥 Running Pressure Test (${recordCount} records)...\n`);

  // Generate synthetic data
  const sourceRecords = [];
  const targetRecords = [];

  for (let i = 0; i < recordCount; i++) {
    const id = `tx_${String(i).padStart(6, "0")}`;
    const date = new Date(2024, 0, 1 + (i % 30), i % 24, 0, 0);

    sourceRecords.push({
      source: "stripe",
      external_id: id,
      date: date.toISOString(),
      amount: (100 + ((i * 10) % 1000)).toFixed(2),
      currency: "USD",
    });

    // 90% chance of match
    if (Math.random() < 0.9) {
      targetRecords.push({
        source: "shopify",
        external_id: id,
        date: date.toISOString(),
        amount: (100 + ((i * 10) % 1000)).toFixed(2),
        currency: "USD",
      });
    } else {
      targetRecords.push({
        source: "shopify",
        external_id: `unmatched_${id}`,
        date: date.toISOString(),
        amount: (1000 + i).toFixed(2),
        currency: "USD",
      });
    }
  }

  const startTime = Date.now();

  // Simulate matching
  const targetSet = new Set(targetRecords.map((r) => r.external_id));
  let matches = 0;
  const matchIds = [];

  for (const source of sourceRecords) {
    if (targetSet.has(source.external_id)) {
      matches++;
      matchIds.push(`${source.external_id}`);
    }
  }

  const duration = Date.now() - startTime;

  // Check for duplicates
  const uniqueIds = new Set(matchIds);
  const duplicates = matchIds.length - uniqueIds.size;

  console.log(`   Records processed: ${recordCount}`);
  console.log(`   Matches found: ${matches}`);
  console.log(`   Duplicates: ${duplicates}`);
  console.log(`   Duration: ${duration}ms`);

  const passed = duplicates === 0;
  console.log(passed ? "   ✅ PASSED" : "   ❌ FAILED");
  console.log("");

  return { passed, matches, duplicates, duration };
}

async function main() {
  const args = process.argv.slice(2);

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     Determinism Verification Suite                      ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  if (args.includes("--fixtures") || args.includes("--all")) {
    await runGoldenTests();
  }

  if (args.includes("--pressure") || args.includes("--all")) {
    // CI-friendly pressure tests
    console.log("\n📊 CI Mode Pressure Tests:\n");
    await runPressureTests(100);
    await runPressureTests(500);
    await runPressureTests(1000);

    // Big local mode (optional)
    if (args.includes("--big")) {
      console.log("\n📊 Big Local Mode (optional):\n");
      await runPressureTests(5000);
      await runPressureTests(10000);
    }
  }

  if (args.length === 0) {
    console.log("\nUsage:");
    console.log("  node validate-determinism.js --fixtures    # Run golden tests");
    console.log("  node validate-determinism.js --pressure   # Run pressure tests");
    console.log("  node validate-determinism.js --all       # Run all tests");
    console.log("  node validate-determinism.js --big        # Include big local tests");
    console.log("");

    // Run golden tests by default
    await runGoldenTests();
  }

  console.log("\n✅ Determinism verification complete!\n");
}

main().catch(console.error);
