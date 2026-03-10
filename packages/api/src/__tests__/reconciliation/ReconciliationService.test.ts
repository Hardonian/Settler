/**
 * Reconciliation Service Tests
 * Tests for the core reconciliation service
 */

import { ReconciliationService } from "../../application/reconciliation/ReconciliationService";
import { IEventStore } from "../../infrastructure/eventsourcing/EventStore";
import { IEventBus } from "../../infrastructure/events/IEventBus";
import { ShopifyAdapter } from "@settler/adapters";
import { StripeAdapter } from "@settler/adapters";
import {
  StartReconciliationCommand,
  RetryReconciliationCommand,
  CancelReconciliationCommand,
  PauseReconciliationCommand,
  ResumeReconciliationCommand,
} from "../../application/cqrs/commands/ReconciliationCommands";
import type { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";
import { ReconciliationTransitionError } from "../../domain/eventsourcing/reconciliation/ReconciliationLifecycle";

describe("ReconciliationService", () => {
  let service: ReconciliationService;
  let mockEventStore: jest.Mocked<IEventStore>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockShopifyAdapter: jest.Mocked<ShopifyAdapter>;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;
  let baseStartedEvent: EventEnvelope;

  const createEvent = (
    eventType: string,
    data: Record<string, unknown>,
    tenantId = "tenant-123"
  ): EventEnvelope => ({
    id: `event-${eventType}`,
    aggregate_id: "recon-123",
    aggregate_type: "reconciliation",
    event_type: eventType,
    event_version: 1,
    data,
    metadata: {
      tenant_id: tenantId,
      correlation_id: "corr-123",
      timestamp: new Date().toISOString(),
    },
    created_at: new Date(),
  });

  beforeEach(() => {
    baseStartedEvent = createEvent("ReconciliationStarted", {
      reconciliation_id: "recon-123",
      job_id: "job-123",
      source_adapter: "shopify",
      target_adapter: "stripe",
      date_range: {
        start: new Date("2024-01-01").toISOString(),
        end: new Date("2024-01-31").toISOString(),
      },
      execution_id: "exec-1",
      attempt_number: 1,
      execution_kind: "initial",
    });

    mockEventStore = {
      append: jest.fn().mockResolvedValue(undefined),
      getEvents: jest.fn().mockResolvedValue([]),
      getSnapshot: jest.fn().mockResolvedValue(null),
      saveSnapshot: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as any;

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

  describe("startReconciliation", () => {
    it("should start a reconciliation successfully", async () => {
      const command: StartReconciliationCommand = {
        reconciliation_id: "recon-123",
        job_id: "job-123",
        tenant_id: "tenant-123",
        source_adapter: "shopify",
        target_adapter: "stripe",
        date_range: {
          start: new Date("2024-01-01").toISOString(),
          end: new Date("2024-01-31").toISOString(),
        },
      };

      await service.startReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it("should reject start when reconciliation already exists", async () => {
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent]);
      const command: StartReconciliationCommand = {
        reconciliation_id: "recon-123",
        job_id: "job-123",
        tenant_id: "tenant-123",
        source_adapter: "shopify",
        target_adapter: "stripe",
        date_range: {
          start: new Date("2024-01-01").toISOString(),
          end: new Date("2024-01-31").toISOString(),
        },
      };

      await expect(service.startReconciliation(command)).rejects.toMatchObject({
        name: "ReconciliationTransitionError",
        attemptedAction: "start",
        currentState: "in_progress",
      });
    });
  });

  describe("retryReconciliation", () => {
    it("should retry a failed reconciliation with incremented attempt metadata", async () => {
      const failedEvent = createEvent("ReconciliationFailed", {
        reconciliation_id: "recon-123",
        error: { type: "RuntimeError", message: "failed" },
      });
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent, failedEvent]);

      const command: RetryReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
      };

      await service.retryReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attempt_number: 2,
            execution_kind: "retry",
            retry_of_execution_id: "exec-1",
          }),
        })
      );
    });

    it("should reject retry for completed reconciliation", async () => {
      const completedEvent = createEvent("ReconciliationCompleted", {
        reconciliation_id: "recon-123",
      });
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent, completedEvent]);

      const command: RetryReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
      };

      await expect(service.retryReconciliation(command)).rejects.toBeInstanceOf(
        ReconciliationTransitionError
      );
    });
  });

  describe("pauseResumeReconciliation", () => {
    it("should pause an in-progress reconciliation", async () => {
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent]);
      const command: PauseReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
      };

      await service.pauseReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: "ReconciliationPaused" })
      );
    });

    it("should resume a paused reconciliation", async () => {
      const pausedEvent = createEvent("ReconciliationPaused", {
        reconciliation_id: "recon-123",
        paused_at: new Date().toISOString(),
      });
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent, pausedEvent]);
      const command: ResumeReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
      };

      await service.resumeReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: "ReconciliationResumed" })
      );
    });
  });

  describe("cancelReconciliation", () => {
    it("should cancel an active reconciliation", async () => {
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent]);
      const command: CancelReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
        reason: "User requested cancellation",
      };

      await service.cancelReconciliation(command);

      expect(mockEventStore.append).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it("should reject cancellation after completion", async () => {
      const completedEvent = createEvent("ReconciliationCompleted", {
        reconciliation_id: "recon-123",
      });
      mockEventStore.getEvents.mockResolvedValue([baseStartedEvent, completedEvent]);

      const command: CancelReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-123",
      };

      await expect(service.cancelReconciliation(command)).rejects.toMatchObject({
        name: "ReconciliationTransitionError",
        attemptedAction: "cancel",
        currentState: "completed",
      });
    });

    it("should reject cross-tenant mutation attempts", async () => {
      mockEventStore.getEvents.mockResolvedValue([
        createEvent(
          "ReconciliationStarted",
          {
            reconciliation_id: "recon-123",
            job_id: "job-123",
            source_adapter: "shopify",
            target_adapter: "stripe",
            date_range: {
              start: new Date("2024-01-01").toISOString(),
              end: new Date("2024-01-31").toISOString(),
            },
            execution_id: "exec-1",
            attempt_number: 1,
            execution_kind: "initial",
          },
          "tenant-a"
        ),
      ]);
      const command: CancelReconciliationCommand = {
        reconciliation_id: "recon-123",
        tenant_id: "tenant-b",
      };

      await expect(service.cancelReconciliation(command)).rejects.toThrow(
        "Tenant invariant violation"
      );
    });
  });

  describe("saga integration", () => {
    it("should trigger saga when reconciliation starts", async () => {
      const command: StartReconciliationCommand = {
        reconciliation_id: "recon-123",
        job_id: "job-123",
        tenant_id: "tenant-123",
        source_adapter: "shopify",
        target_adapter: "stripe",
        date_range: {
          start: new Date("2024-01-01").toISOString(),
          end: new Date("2024-01-31").toISOString(),
        },
      };

      await service.startReconciliation(command);

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "reconciliation.started",
        expect.any(Function)
      );
    });
  });
});
