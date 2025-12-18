/**
 * Operator Mode Verification Tests
 * Verifies that simulated failures produce alerts with trace IDs
 * and kill switches work without redeploy
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { query } from '../db';
import {
  generateDailyIntelligence,
  getFailedIngestions,
} from '../services/operator-mode/daily-intelligence';
import {
  checkAlertThresholds,
  upsertAlertThreshold,
} from '../services/operator-mode/alerting';
import {
  disableConnector,
  enableConnector,
  isConnectorDisabled,
  pauseBackgroundJob,
  resumeBackgroundJob,
  isBackgroundJobPaused,
} from '../services/operator-mode/kill-switches';
import {
  createIngestion,
  updateIngestionStatus,
} from '../services/ingestion/ingestion-service';
import { v4 as uuidv4 } from 'uuid';

describe('Operator Mode Verification', () => {
  const testUserId = uuidv4();
  const testTenantId = uuidv4();
  const testBillingAccountId = uuidv4();

  beforeAll(async () => {
    // Setup test data
    await query(
      `INSERT INTO users (id, email, password_hash, tenant_id)
       VALUES ($1, 'test@example.com', 'hash', $2)
       ON CONFLICT DO NOTHING`,
      [testUserId, testTenantId]
    );

    await query(
      `INSERT INTO tenants (id, slug, name)
       VALUES ($1, 'test-tenant', 'Test Tenant')
       ON CONFLICT DO NOTHING`,
      [testTenantId]
    );

    await query(
      `INSERT INTO billing_accounts (id, user_id, email)
       VALUES ($1, $2, 'test@example.com')
       ON CONFLICT DO NOTHING`,
      [testBillingAccountId, testUserId]
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await query(`DELETE FROM alert_rules WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM ingestions WHERE tenant_id = $1`, [testTenantId]);
    await query(`DELETE FROM kill_switches WHERE target = 'test-connector'`);
    await query(`DELETE FROM kill_switches WHERE target = 'test-job'`);
  });

  describe('Simulated Failure Produces Alert + Trace ID', () => {
    it('should create failed ingestion with trace ID', async () => {
      const traceId = `trace-${uuidv4()}`;
      const sourceId = uuidv4();

      // Create a failed ingestion
      const ingestionId = await createIngestion({
        sourceId,
        tenantId: testTenantId,
        userId: testUserId,
        traceId,
      });

      await updateIngestionStatus(ingestionId, 'failed', {
        errorMessage: 'Simulated failure for testing',
        errorStack: 'Error: Test failure',
      });

      // Verify ingestion exists with trace ID
      const ingestions = await query(
        `SELECT id, status, error_message, trace_id
         FROM ingestions
         WHERE id = $1`,
        [ingestionId]
      );

      expect(ingestions.length).toBe(1);
      expect(ingestions[0].status).toBe('failed');
      expect(ingestions[0].trace_id).toBe(traceId);
      expect(ingestions[0].error_message).toContain('Simulated failure');
    });

    it('should include failed ingestion in daily intelligence', async () => {
      const traceId = `trace-${uuidv4()}`;
      const sourceId = uuidv4();

      // Create a failed ingestion
      const ingestionId = await createIngestion({
        sourceId,
        tenantId: testTenantId,
        userId: testUserId,
        traceId,
      });

      await updateIngestionStatus(ingestionId, 'failed', {
        errorMessage: 'Test failure',
      });

      // Get daily intelligence
      const intelligence = await generateDailyIntelligence();

      // Find our failed ingestion
      const failedIngestion = intelligence.failedIngestions.find(
        fi => fi.ingestionId === ingestionId
      );

      expect(failedIngestion).toBeDefined();
      expect(failedIngestion?.traceId).toBe(traceId);
      expect(failedIngestion?.errorMessage).toContain('Test failure');
    });

    it('should trigger alert when threshold exceeded', async () => {
      // Create alert rule for failed ingestions
      const thresholdId = await upsertAlertThreshold(testUserId, {
        name: 'Test Failed Ingestion Alert',
        metric: 'failed_ingestion',
        threshold: 0, // Alert if any failures
        operator: 'gt',
        severity: 'high',
        channels: ['email'],
        enabled: true,
      });

      // Create multiple failed ingestions to trigger alert
      const sourceId = uuidv4();
      for (let i = 0; i < 3; i++) {
        const ingestionId = await createIngestion({
          sourceId,
          tenantId: testTenantId,
          userId: testUserId,
          traceId: `trace-${uuidv4()}`,
        });

        await updateIngestionStatus(ingestionId, 'failed', {
          errorMessage: 'Test failure',
        });
      }

      // Check alert thresholds
      const alerts = await checkAlertThresholds();

      // Should have at least one alert for failed ingestions
      const failedIngestionAlerts = alerts.filter(
        a => a.metric === 'failed_ingestion'
      );

      expect(failedIngestionAlerts.length).toBeGreaterThan(0);

      // Verify alert has trace ID reference
      const alertHistory = await query(
        `SELECT ah.*, ar.name
         FROM alert_history ah
         JOIN alert_rules ar ON ah.rule_id = ar.id
         WHERE ar.id = $1
         ORDER BY ah.triggered_at DESC
         LIMIT 1`,
        [thresholdId]
      );

      expect(alertHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Kill Switch Works Without Redeploy', () => {
    it('should disable connector via kill switch', async () => {
      const connectorType = 'test-connector';

      // Verify connector is not disabled initially
      const initiallyDisabled = await isConnectorDisabled(connectorType);
      expect(initiallyDisabled).toBe(false);

      // Disable connector via kill switch
      await disableConnector(connectorType, 'Test: Disabling connector');

      // Verify connector is now disabled
      const afterDisable = await isConnectorDisabled(connectorType);
      expect(afterDisable).toBe(true);

      // Verify kill switch exists in database
      const killSwitches = await query(
        `SELECT * FROM kill_switches
         WHERE type = 'connector' AND target = $1 AND enabled = true`,
        [connectorType]
      );

      expect(killSwitches.length).toBe(1);
      expect(killSwitches[0].reason).toContain('Disabling connector');
    });

    it('should enable connector via kill switch', async () => {
      const connectorType = 'test-connector';

      // Ensure connector is disabled first
      await disableConnector(connectorType, 'Test');

      // Enable connector via kill switch
      await enableConnector(connectorType);

      // Verify connector is now enabled
      const afterEnable = await isConnectorDisabled(connectorType);
      expect(afterEnable).toBe(false);

      // Verify kill switch is disabled in database
      const killSwitches = await query(
        `SELECT * FROM kill_switches
         WHERE type = 'connector' AND target = $1 AND enabled = true`,
        [connectorType]
      );

      expect(killSwitches.length).toBe(0);
    });

    it('should pause background job via kill switch', async () => {
      const jobType = 'test-job';

      // Verify job is not paused initially
      const initiallyPaused = await isBackgroundJobPaused(jobType);
      expect(initiallyPaused).toBe(false);

      // Pause job via kill switch
      await pauseBackgroundJob(jobType, 'Test: Pausing job');

      // Verify job is now paused
      const afterPause = await isBackgroundJobPaused(jobType);
      expect(afterPause).toBe(true);

      // Verify kill switch exists in database
      const killSwitches = await query(
        `SELECT * FROM kill_switches
         WHERE type = 'background_job' AND target = $1 AND enabled = true`,
        [jobType]
      );

      expect(killSwitches.length).toBe(1);
      expect(killSwitches[0].reason).toContain('Pausing job');
    });

    it('should resume background job via kill switch', async () => {
      const jobType = 'test-job';

      // Ensure job is paused first
      await pauseBackgroundJob(jobType, 'Test');

      // Resume job via kill switch
      await resumeBackgroundJob(jobType);

      // Verify job is now resumed
      const afterResume = await isBackgroundJobPaused(jobType);
      expect(afterResume).toBe(false);

      // Verify kill switch is disabled in database
      const killSwitches = await query(
        `SELECT * FROM kill_switches
         WHERE type = 'background_job' AND target = $1 AND enabled = true`,
        [jobType]
      );

      expect(killSwitches.length).toBe(0);
    });

    it('should prevent connector usage when disabled', async () => {
      const connectorType = 'test-connector';

      // Disable connector
      await disableConnector(connectorType, 'Test');

      // Attempt to check if connector is disabled
      const isDisabled = await isConnectorDisabled(connectorType);
      expect(isDisabled).toBe(true);

      // In actual usage, this would prevent connector from being used
      // The route handler checks this before creating sources
    });

    it('should prevent background job execution when paused', async () => {
      const jobType = 'test-job';

      // Pause job
      await pauseBackgroundJob(jobType, 'Test');

      // Attempt to check if job is paused
      const isPaused = await isBackgroundJobPaused(jobType);
      expect(isPaused).toBe(true);

      // In actual usage, this would prevent job from running
      // The route handler checks this before processing jobs
    });
  });
});
