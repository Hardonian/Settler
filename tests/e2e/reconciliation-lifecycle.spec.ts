import { test, expect } from "@playwright/test";

test.describe("Reconciliation Lifecycle", () => {
  test("shows truthful result context for a completed run", async ({ page }) => {
    const RUN_ID = "test-run-id-12345";
    const reconciliationUrl = `/api/console/reconciliation?id=${RUN_ID}`;

    await page.route(reconciliationUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reconciliation: {
            id: RUN_ID,
            status: "completed",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            totalDelta: 123.45,
            mismatchCount: 1,
            currency: "USD",
            highestRiskItem: {
              id: "item-1",
              status: "unmatched",
              sourceAmount: 100,
              sourceCurrency: "USD",
              targetAmount: 0,
              targetCurrency: "USD",
              delta: 100,
              explanation: {
                summary: "Amount differs from the expected settlement total.",
                whyItMatters: "This variance could change the booked cash position.",
                evidence: [],
                suggestedNextStep: "Compare the source settlement against the ledger entry.",
              },
              impact: { riskScore: 0.8, confidence: 0.5 },
              urgency: "high",
            },
          },
          items: [
            {
              id: "item-1",
              status: "unmatched",
              sourceAmount: 100,
              sourceCurrency: "USD",
              targetAmount: 0,
              targetCurrency: "USD",
              delta: 100,
              explanation: {
                summary: "Amount differs from the expected settlement total.",
                whyItMatters: "This variance could change the booked cash position.",
                evidence: [],
                suggestedNextStep: "Compare the source settlement against the ledger entry.",
              },
              impact: { riskScore: 0.8, confidence: 0.5 },
              urgency: "high",
            },
          ],
        }),
      });
    });

    await page.goto(`http://localhost:3000/console/reconciliations?runId=${RUN_ID}`);

    await expect(page.getByText("Reconciliation Results")).toBeVisible();
    await expect(page.getByText("Highest Risk Item")).toBeVisible();
    await expect(page.getByText("$123.45")).toBeVisible();
    await expect(page.getByRole("cell", { name: "unmatched" })).toBeVisible();
    await expect(
      page.getByText("Amount differs from the expected settlement total.")
    ).toBeVisible();
    await expect(
      page.getByText("Next: Compare the source settlement against the ledger entry.")
    ).toBeVisible();
  });

  test("explains how to reach reconciliation results when no run is selected", async ({ page }) => {
    await page.route("/api/runs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("http://localhost:3000/console/reconciliations");

    await expect(page.getByText("How This Surface Works")).toBeVisible();
    await expect(page.getByText("No runs available yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Runs" })).toBeVisible();
  });
});
