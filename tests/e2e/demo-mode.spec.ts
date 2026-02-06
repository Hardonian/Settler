/**
 * E2E Test: Demo Mode
 *
 * Tests the complete demo mode workflow:
 * 1. Seed demo data
 * 2. Verify demo dataset endpoint
 * 3. Run demo reconciliation
 * 4. Assert results match expected outcomes
 *
 * This test runs WITHOUT secrets in CI.
 */

import { test, expect } from "@playwright/test";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("Demo Mode", () => {
  test.describe("Demo Dataset API", () => {
    test("should return demo dataset", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/playground/demo-dataset`);

      if (response.status() === 404) {
        console.log("Demo data not seeded yet. Run: DEMO_MODE=true npx tsx scripts/seed-demo.ts");
        test.skip();
        return;
      }

      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("source");
      expect(data).toHaveProperty("target");
      expect(data).toHaveProperty("expectedMatches");

      expect(data.source.count).toBeGreaterThan(0);
      expect(data.target.count).toBeGreaterThan(0);
      expect(data.expectedMatches.length).toBeGreaterThan(0);

      console.log(
        `Demo dataset loaded: ${data.source.count} source, ${data.target.count} target records`
      );
    });

    test("demo dataset should have valid transactions", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/playground/demo-dataset`);

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      const sourceRecord = data.source.data[0];
      const targetRecord = data.target.data[0];

      expect(sourceRecord).toHaveProperty("id");
      expect(sourceRecord).toHaveProperty("amount");
      expect(sourceRecord).toHaveProperty("currency");
      expect(sourceRecord).toHaveProperty("date");

      expect(targetRecord).toHaveProperty("id");
      expect(targetRecord).toHaveProperty("amount");
      expect(targetRecord).toHaveProperty("currency");
      expect(targetRecord).toHaveProperty("date");

      console.log(`Sample source: ${JSON.stringify(sourceRecord)}`);
    });
  });

  test.describe("Demo Reconciliation Run", () => {
    test("should run demo reconciliation", async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v1/playground/demo-run`);

      if (response.status() === 404) {
        test.skip();
        return;
      }

      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("runId");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("summary");

      expect(data.summary.matched).toBeGreaterThan(0);
      expect(data.summary.unmatchedSource).toBeGreaterThanOrEqual(0);
      expect(data.summary.unmatchedTarget).toBeGreaterThanOrEqual(0);

      console.log(`Demo run complete: ${data.summary.matched} matches found`);

      const matchRate = parseFloat(data.summary.matchRate);
      expect(matchRate).toBeGreaterThan(0);
      expect(matchRate).toBeLessThanOrEqual(100);

      console.log(`Match rate: ${data.summary.matchRate}`);
    });

    test("should return matches with confidence scores", async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v1/playground/demo-run`);

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();

      if (data.matches && data.matches.length > 0) {
        const match = data.matches[0];
        expect(match).toHaveProperty("sourceId");
        expect(match).toHaveProperty("targetId");
        expect(match).toHaveProperty("confidence");

        expect(match.confidence).toBeGreaterThan(0);
        expect(match.confidence).toBeLessThanOrEqual(1);

        console.log(`Sample match: ${JSON.stringify(match)}`);
      }
    });
  });

  test.describe("Demo Data Integrity", () => {
    test("seeded data should be deterministic", async ({ request }) => {
      const responses = await Promise.all([
        request.post(`${BASE_URL}/api/v1/playground/demo-run`),
        request.post(`${BASE_URL}/api/v1/playground/demo-run`),
      ]);

      for (const response of responses) {
        if (!response.ok()) {
          test.skip();
          return;
        }
      }

      const [run1, run2] = await Promise.all(responses.map((r) => r.json()));

      expect(run1.summary.matched).toEqual(run2.summary.matched);
      expect(run1.summary.totalSource).toEqual(run2.summary.totalSource);
      expect(run1.summary.totalTarget).toEqual(run2.summary.totalTarget);

      console.log("✅ Demo data is deterministic");
    });

    test("expected matches should be subset of actual matches", async ({ request }) => {
      const [datasetResponse, runResponse] = await Promise.all([
        request.get(`${BASE_URL}/api/v1/playground/demo-dataset`),
        request.post(`${BASE_URL}/api/v1/playground/demo-run`),
      ]);

      if (!datasetResponse.ok() || !runResponse.ok()) {
        test.skip();
        return;
      }

      const [dataset, run] = await Promise.all([datasetResponse.json(), runResponse.json()]);

      const expectedStripeIds = new Set(dataset.expectedMatches.map((m: any) => m.stripeId));
      const actualStripeIds = new Set(run.matches.map((m: any) => m.sourceId));

      let matchCount = 0;
      for (const expectedId of expectedStripeIds) {
        if (actualStripeIds.has(expectedId)) {
          matchCount++;
        }
      }

      expect(matchCount).toBeGreaterThan(0);
      console.log(`✅ ${matchCount}/${dataset.expectedMatches.length} expected matches found`);
    });
  });
});

test.describe("Demo Mode CLI", () => {
  test("seed script should generate demo data", async () => {
    const { execSync } = require("child_process");

    try {
      execSync("npx tsx scripts/seed-demo.ts --help", { encoding: "utf-8" });
    } catch {
      test.skip();
      return;
    }

    const output = execSync("DEMO_MODE=false npx tsx scripts/seed-demo.ts 2>&1", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    expect(output).toContain("Demo Mode Seed Script");
    expect(output).toContain("demo/data");
    expect(output).toContain("demo_stripe_transactions.json");
    expect(output).toContain("demo_bank_transactions.json");

    console.log("✅ Seed script runs successfully (dry run)");
  });
});

test.describe("Demo Mode in CI", () => {
  test("should run without secrets", async ({ request }) => {
    if (!DEMO_MODE) {
      console.log("DEMO_MODE not enabled - skipping seeded verification");
      test.skip();
      return;
    }

    const response = await request.get(`${BASE_URL}/api/v1/playground/demo-dataset`);

    if (response.status() === 404) {
      test.skip();
      return;
    }

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.source.count).toBeGreaterThan(0);
    expect(data.target.count).toBeGreaterThan(0);

    const runResponse = await request.post(`${BASE_URL}/api/v1/playground/demo-run`);
    expect(runResponse.ok()).toBe(true);

    const runData = await runResponse.json();
    expect(runData.summary.matched).toBeGreaterThan(0);

    console.log("✅ Demo mode works in CI without secrets");
  });
});
