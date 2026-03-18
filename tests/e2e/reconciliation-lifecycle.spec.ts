import { test, expect } from "@playwright/test";

test.describe("Reconciliation Lifecycle", () => {
  test("should handle the asynchronous run and polling workflow", async ({ page }) => {
    const RUN_ID = "test-run-id-12345";
    const reconciliationUrl = `/api/console/reconciliation?id=${RUN_ID}`;

    let pollCount = 0;

    // Mock the GET polling endpoint
    await page.route(reconciliationUrl, async (route) => {
      pollCount++;
      if (pollCount <= 2) {
        // First two polls return 'running'
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reconciliation: {
              id: RUN_ID,
              status: "running",
              startedAt: new Date().toISOString(),
              totalDelta: 0,
              mismatchCount: 0,
            },
            items: [],
          }),
        });
      } else {
        // Third poll returns 'completed'
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
                impact: { riskScore: 0.8, confidence: 0.5 },
                urgency: "high",
              },
            ],
          }),
        });
      }
    });

    // Mock the initial POST request to start the run
    await page.route("/api/console/reconciliation", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        await route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify({ runId: RUN_ID }),
        });
        return;
      }
      // Let other requests pass, particularly the GET requests for polling
      await route.continue();
    });

    // Navigate to a page where the component is rendered.
    // Assuming there is a page that renders ReconciliationView when no ID is provided.
    await page.goto("http://localhost:3000/console/reconciliation");

    // Find and click the "Run Reconciliation" button
    const runButton = page.getByRole("button", { name: /Run Reconciliation/i });
    await expect(runButton).toBeVisible();
    await runButton.click();

    // Assert that the UI enters a "Running..." state
    await expect(page.getByRole("button", { name: /Running/i })).toBeVisible({ timeout: 2000 });

    // Assert that the final "completed" state is rendered after polling
    // The summary card should eventually appear and show the completed status.
    await expect(page.getByText("Status: completed")).toBeVisible({ timeout: 10000 });

    // Verify summary card details
    await expect(page.getByText("$123.45")).toBeVisible();
    await expect(page.getByText("Mismatches")).toBeVisible();

    const mismatchCountElement = page.locator('div > p:has-text("Mismatches") + p');
    await expect(mismatchCountElement).toHaveText("1");

    // Assert that the items table is rendered with the correct data
    const unmatchedCell = page.getByRole("cell", { name: "unmatched" });
    await expect(unmatchedCell).toBeVisible();

    const riskScoreCell = page.locator('td > div.flex > span:has-text("80%")');
    await expect(riskScoreCell).toBeVisible();
  });
});
