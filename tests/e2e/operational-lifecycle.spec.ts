import { test, expect } from '@playwright/test';

test.describe('End-to-End Operational Lifecycle Reality Pass', () => {
  test.use({ storageState: 'playwright/.auth/operator.json' }); // Assuming authenticated operator state

  test('Executes a full run, identifies exceptions, resolves them, and verifies audit provenance', async ({ page }) => {
    // 1. Ingestion / Run Creation
    await page.goto('/operator/runs/new');
    await page.getByRole('button', { name: 'Trigger Reconciliation Run' }).click();

    // Wait for the system to process and navigate to the Run Detail
    await expect(page).toHaveURL(/\/operator\/runs\/run_[a-zA-Z0-9_-]+/);
    const runUrl = page.url();
    const runId = runUrl.split('/').pop();
    expect(runId).toBeTruthy();

    // 2. Run Detail & Outcome Continuity
    // Hostile condition check: should not show fake success if workers are processing
    await expect(page.getByText('Status: Processing')).toBeVisible();

    // Poll/wait for worker to finish and emit outcomes
    await expect(page.getByText('Status: Completed with Exceptions')).toBeVisible({ timeout: 15000 });

    // Verify Results/Exceptions are not zeroed out or hidden
    const exceptionCount = await page.locator('[data-testid="exception-count"]').textContent();
    expect(Number(exceptionCount)).toBeGreaterThan(0);

    // 3. Exception Review & Resolution Continuity
    await page.getByRole('link', { name: 'View Exceptions' }).click();
    await expect(page).toHaveURL(/\/operator\/exceptions\?run_id=/);

    // Select the first exception and resolve it
    await page.locator('[data-testid="exception-row"]').first().click();
    await expect(page.getByText('Exception Detail')).toBeVisible();

    const errorSignature = await page.locator('[data-testid="error-signature"]').textContent();
    expect(errorSignature).toBeTruthy();

    // Apply a resolution
    await page.getByRole('button', { name: 'Resolve' }).click();
    await page.getByLabel('Resolution Reason').fill('E2E Automated Resolution Verification');
    await page.getByRole('button', { name: 'Confirm Resolution' }).click();

    await expect(page.getByText('Exception Resolved Successfully')).toBeVisible();

    // 4. Audit & Provenance Verification
    // Navigate to the Audit Log to prove the action was recorded with consequence
    await page.goto('/operator/audit-log');
    await page.getByPlaceholder('Search by Trace ID or Entity').fill(runId as string);
    await page.keyboard.press('Enter');

    const auditEntry = page.locator('[data-testid="audit-row"]').first();
    await expect(auditEntry).toBeVisible();
    await expect(auditEntry).toContainText('EXCEPTION_RESOLVED');
    await expect(auditEntry).toContainText(runId as string);
    await expect(auditEntry).toContainText('E2E Automated Resolution Verification');

    // 5. Workflow Return Continuity
    // Ensure we can get back to the run and it reflects the new state
    await page.goto(runUrl);
    const updatedExceptionCount = await page.locator('[data-testid="unresolved-exception-count"]').textContent();
    expect(Number(updatedExceptionCount)).toBeLessThan(Number(exceptionCount));
  });

  test('Hostile Condition: Degraded worker state blocks ingestion truthfully', async ({ page }) => {
    // Simulate operator toggling the kill switch
    await page.goto('/operator/settings/infrastructure');
    await page.getByRole('switch', { name: 'Reconciliation Workers' }).uncheck();
    await page.getByRole('button', { name: 'Save Constraints' }).click();

    // Attempt run
    await page.goto('/operator/runs/new');
    await page.getByRole('button', { name: 'Trigger Reconciliation Run' }).click();

    // Verify UI tells the truth instead of generic 500
    await expect(page.getByText('Action Blocked: Reconciliation Workers are currently disabled in Infrastructure Settings')).toBeVisible();
  });

  test('Resilience: Stale Run Reaper identifies and transitions stalled processing runs', async ({ request, page }) => {
    // 1. Manually inject a run directly into the DB state as "Processing" via API to simulate a crashed worker
    const stalledRunRes = await request.post('/api/operator/runs/simulate-stalled', {
      data: { ageInMinutes: 65 } // Beyond the standard 60-minute timeout threshold
    });
    const { runId } = await stalledRunRes.json();

    // 2. Trigger the Reaper job (usually runs via cron, triggered manually for E2E)
    await request.post('/api/jobs/reaper/stale-runs');

    // 3. Verify the run was caught and transitioned safely rather than remaining zombie
    await page.goto(`/operator/runs/${runId}`);
    await expect(page.getByText('Status: Failed - Timed Out')).toBeVisible();
    await expect(page.getByText('System recovered orphaned run after worker timeout.')).toBeVisible();
  });

  test('Bulk-Audit Semantics: Resolving multiple exceptions produces a single verifiable batch audit trail', async ({ page }) => {
    // Navigate to exception queue
    await page.goto('/operator/exceptions');

    // Select multiple exceptions using bulk checkboxes
    await page.locator('[data-testid="bulk-select-all"]').click();
    await page.getByRole('button', { name: 'Bulk Resolve' }).click();

    await page.getByLabel('Resolution Reason').fill('E2E Automated Bulk Resolution');
    await page.getByRole('button', { name: 'Confirm Bulk Resolution' }).click();
    await expect(page.getByText('Exceptions Resolved Successfully')).toBeVisible();

    // Verify Bulk Audit Log structure
    await page.goto('/operator/audit-log');

    // We expect ONE new entry for the bulk action, not N entries flooding the UI
    const topAuditEntry = page.locator('[data-testid="audit-row"]').first();
    await expect(topAuditEntry).toBeVisible();
    await expect(topAuditEntry).toContainText('BULK_EXCEPTION_RESOLVED');
    await expect(topAuditEntry).toContainText('E2E Automated Bulk Resolution');

    // Verify the UI allows expanding the batch to see the underlying entities
    await topAuditEntry.getByRole('button', { name: 'View Batch Details' }).click();
    const batchCount = await page.locator('[data-testid="batch-entity-count"]').textContent();
    expect(Number(batchCount)).toBeGreaterThan(1);
  });
});
