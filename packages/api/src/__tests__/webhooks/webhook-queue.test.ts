/**
 * Webhook Queue Tests
 * Tests for webhook delivery and retry logic
 */

import {
  processWebhookDelivery,
  processPendingWebhooks,
  queueWebhookDelivery,
} from '../../utils/webhook-queue';
import { query } from '../../db';
import { generateWebhookSignature } from '../../utils/webhook-signature';
import { config } from '../../config';

// Mock dependencies
jest.mock('../../db');
jest.mock('../../utils/webhook-signature');
jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGenerateSignature = generateWebhookSignature as jest.MockedFunction<
  typeof generateWebhookSignature
>;

// Mock fetch globally
global.fetch = jest.fn();

describe('Webhook Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateSignature.mockReturnValue('test-signature');
  });

  describe('processWebhookDelivery', () => {
    it('should successfully deliver webhook', async () => {
      const delivery = {
        id: 'delivery-123',
        webhookId: 'webhook-123',
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      mockQuery.mockResolvedValue([]);

      await processWebhookDelivery(delivery);

      expect(global.fetch).toHaveBeenCalledWith(
        delivery.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Webhook-Signature': 'test-signature',
          }),
        })
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE webhook_deliveries'),
        expect.arrayContaining([200, 1, 'delivery-123'])
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      const delivery = {
        id: 'delivery-123',
        webhookId: 'webhook-123',
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      mockQuery.mockResolvedValue([]);

      await processWebhookDelivery(delivery);

      // Should attempt maxRetries + 1 times
      expect(global.fetch).toHaveBeenCalledTimes(config.webhook.maxRetries + 1);

      // Should update with retry information
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE webhook_deliveries'),
        expect.arrayContaining([
          expect.any(String), // error message
          expect.any(Number), // attempt number
          expect.any(Date), // next_retry_at
          'delivery-123',
        ])
      );
    });

    it('should mark as failed after max retries', async () => {
      const delivery = {
        id: 'delivery-123',
        webhookId: 'webhook-123',
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      mockQuery.mockResolvedValue([]);

      await processWebhookDelivery(delivery);

      // Should mark as failed
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE webhook_deliveries'),
        expect.arrayContaining([
          expect.any(String), // error message
          config.webhook.maxRetries + 1, // attempts
          'delivery-123',
        ])
      );
    });

    it('should handle HTTP error responses', async () => {
      const delivery = {
        id: 'delivery-123',
        webhookId: 'webhook-123',
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      mockQuery.mockResolvedValue([]);

      await processWebhookDelivery(delivery);

      // Should retry on HTTP errors
      expect(global.fetch).toHaveBeenCalledTimes(config.webhook.maxRetries + 1);
    });
  });

  describe('processPendingWebhooks', () => {
    it('should process pending webhooks', async () => {
      const pendingWebhooks = [
        {
          id: 'delivery-1',
          webhookId: 'webhook-1',
          url: 'https://example.com/webhook1',
          payload: { event: 'test1' },
          secret: 'secret-1',
        },
        {
          id: 'delivery-2',
          webhookId: 'webhook-2',
          url: 'https://example.com/webhook2',
          payload: { event: 'test2' },
          secret: 'secret-2',
        },
      ];

      mockQuery.mockResolvedValueOnce(pendingWebhooks as any);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      mockQuery.mockResolvedValue([]);

      await processPendingWebhooks();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [config.webhook.maxRetries]
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty pending queue', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await processPendingWebhooks();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('queueWebhookDelivery', () => {
    it('should queue webhook for delivery', async () => {
      const webhookId = 'webhook-123';
      const payload = { event: 'test', data: { id: '123' } };

      mockQuery
        .mockResolvedValueOnce([
          { url: 'https://example.com/webhook', secret: 'test-secret' },
        ])
        .mockResolvedValueOnce([{ id: 'delivery-123' }]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      mockQuery.mockResolvedValue([]);

      const deliveryId = await queueWebhookDelivery(webhookId, payload);

      expect(deliveryId).toBe('delivery-123');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO webhook_deliveries'),
        expect.arrayContaining([webhookId, 'https://example.com/webhook'])
      );
    });

    it('should throw error if webhook not found', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await expect(
        queueWebhookDelivery('invalid-webhook', { event: 'test' })
      ).rejects.toThrow('Webhook not found or inactive');
    });
  });
});
