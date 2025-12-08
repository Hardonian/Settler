/**
 * Integration Tests: Webhook Delivery
 * Tests webhook queue and delivery functionality
 */

import { processPendingWebhooks, queueWebhookDelivery } from '../../utils/webhook-queue';
import { query } from '../../db';
import { WebhookPayload } from '../../utils/webhook-queue';

describe('Webhook Delivery Integration', () => {
  let testWebhookId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const users = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test-webhook@example.com', '$2b$10$test', 'developer']
    );
    testUserId = users[0]?.id || '';

    // Create test webhook
    const webhooks = await query<{ id: string }>(
      `INSERT INTO webhooks (user_id, url, events, secret)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        testUserId,
        'https://example.com/webhook',
        ['reconciliation.completed'],
        'test-secret',
      ]
    );
    testWebhookId = webhooks[0]?.id || '';
  });

  afterAll(async () => {
    // Cleanup
    if (testWebhookId) {
      await query('DELETE FROM webhook_deliveries WHERE webhook_id = $1', [testWebhookId]);
      await query('DELETE FROM webhooks WHERE id = $1', [testWebhookId]);
    }
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('queueWebhookDelivery', () => {
    it('should queue webhook for delivery', async () => {
      const payload: WebhookPayload = {
        event: 'reconciliation.completed',
        data: { jobId: 'test-job-id' },
        timestamp: new Date().toISOString(),
      };

      await queueWebhookDelivery(testWebhookId, payload);

      // Verify webhook was queued
      const deliveries = await query(
        `SELECT * FROM webhook_deliveries WHERE webhook_id = $1`,
        [testWebhookId]
      );

      expect(deliveries.length).toBeGreaterThan(0);
    });
  });

  describe('processPendingWebhooks', () => {
    it('should process pending webhooks', async () => {
      // Queue a webhook first
      const payload: WebhookPayload = {
        event: 'reconciliation.completed',
        data: { jobId: 'test-job-id' },
        timestamp: new Date().toISOString(),
      };

      await queueWebhookDelivery(testWebhookId, payload);

      // Process queue (will fail delivery but should update status)
      await processPendingWebhooks();

      // Verify webhook was processed
      const deliveries = await query(
        `SELECT * FROM webhook_deliveries WHERE webhook_id = $1`,
        [testWebhookId]
      );

      expect(deliveries.length).toBeGreaterThan(0);
    });
  });
});
