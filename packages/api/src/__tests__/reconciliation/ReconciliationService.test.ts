/**
 * Reconciliation Service Tests
 * Tests for the core reconciliation service
 */

import { ReconciliationService } from '../../application/reconciliation/ReconciliationService';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { IEventBus } from '../../infrastructure/events/IEventBus';
import { ShopifyAdapter } from '@settler/adapters';
import { StripeAdapter } from '@settler/adapters';
import {
  StartReconciliationCommand,
  RetryReconciliationCommand,
  CancelReconciliationCommand,
} from '../../application/cqrs/commands/ReconciliationCommands';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let mockEventStore: jest.Mocked<IEventStore>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockShopifyAdapter: jest.Mocked<ShopifyAdapter>;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;

  beforeEach(() => {
    // Mock EventStore
    mockEventStore = {
      append: jest.fn().mockResolvedValue(undefined),
      getEvents: jest.fn().mockResolvedValue([]),
      getSnapshot: jest.fn().mockResolvedValue(null),
      saveSnapshot: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock EventBus
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as any;

    // Mock Adapters
    mockShopifyAdapter = {
      fetch: jest.fn(),
      validate: jest.fn().mockResolvedValue(true),
    } as any;

    mockStripeAdapter = {
      fetch: jest.fn(),
      validate: jest.fn().mockResolvedValue(true),
    } as any;

    service = new ReconciliationService(
      mockEventStore,
      mockEventBus,
      mockShopifyAdapter,
      mockStripeAdapter
    );
  });

  describe('startReconciliation', () => {
    it('should start a reconciliation successfully', async () => {
      const command: StartReconciliationCommand = {
        reconciliationId: 'recon-123',
        jobId: 'job-123',
        tenantId: 'tenant-123',
        sourceAdapter: 'shopify',
        targetAdapter: 'stripe',
        sourceConfig: { apiKey: 'test-key' },
        targetConfig: { apiKey: 'test-key' },
        matchingRules: {
          matching: [
            { field: 'order_id', type: 'exact' },
            { field: 'amount', type: 'exact', tolerance: 0.01 },
          ],
        },
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      await service.startReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should handle errors during reconciliation start', async () => {
      mockEventStore.append.mockRejectedValue(new Error('Database error'));

      const command: StartReconciliationCommand = {
        reconciliationId: 'recon-123',
        jobId: 'job-123',
        tenantId: 'tenant-123',
        sourceAdapter: 'shopify',
        targetAdapter: 'stripe',
        sourceConfig: {},
        targetConfig: {},
        matchingRules: { matching: [] },
      };

      await expect(service.startReconciliation(command)).rejects.toThrow('Database error');
    });
  });

  describe('retryReconciliation', () => {
    it('should retry a failed reconciliation', async () => {
      const command: RetryReconciliationCommand = {
        reconciliationId: 'recon-123',
        tenantId: 'tenant-123',
      };

      await service.retryReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalled();
    });

    it('should handle retry errors', async () => {
      mockEventStore.append.mockRejectedValue(new Error('Retry failed'));

      const command: RetryReconciliationCommand = {
        reconciliationId: 'recon-123',
        tenantId: 'tenant-123',
      };

      await expect(service.retryReconciliation(command)).rejects.toThrow('Retry failed');
    });
  });

  describe('cancelReconciliation', () => {
    it('should cancel an active reconciliation', async () => {
      const command: CancelReconciliationCommand = {
        reconciliationId: 'recon-123',
        tenantId: 'tenant-123',
        reason: 'User requested cancellation',
      };

      await service.cancelReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('saga integration', () => {
    it('should trigger saga when reconciliation starts', async () => {
      const command: StartReconciliationCommand = {
        reconciliationId: 'recon-123',
        jobId: 'job-123',
        tenantId: 'tenant-123',
        sourceAdapter: 'shopify',
        targetAdapter: 'stripe',
        sourceConfig: {},
        targetConfig: {},
        matchingRules: { matching: [] },
      };

      await service.startReconciliation(command);

      // Verify saga was subscribed to reconciliation.started event
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        'reconciliation.started',
        expect.any(Function)
      );
    });
  });
});
