/**
 * Reconciliation Command Handlers
 * Handle commands and emit events
 */

import { IEventStore } from '../../../infrastructure/eventsourcing/EventStore';
import {
  StartReconciliationCommand,
  RetryReconciliationCommand,
  CancelReconciliationCommand,
  PauseReconciliationCommand,
  ResumeReconciliationCommand,
} from './ReconciliationCommands';
import { ReconciliationEvents, ReconciliationStartedData } from '../../../domain/eventsourcing/reconciliation/ReconciliationEvents';
import { IEventBus } from '../../../infrastructure/events/IEventBus';
import { DomainEvent } from '../../../domain/events/DomainEvent';

export class ReconciliationCommandHandlers {
  constructor(
    private eventStore: IEventStore,
    private eventBus: IEventBus
  ) {}

  async handleStartReconciliation(command: StartReconciliationCommand): Promise<void> {
    // Validate permissions and input
    // In a real implementation, check tenant permissions, job exists, etc.

    // Create and emit ReconciliationStarted event
    const eventData: ReconciliationStartedData = {
      reconciliation_id: command.reconciliation_id,
      job_id: command.job_id,
      source_adapter: command.source_adapter,
      target_adapter: command.target_adapter,
      date_range: command.date_range,
    };
    if (command.user_id) {
      eventData.initiated_by = command.user_id;
    }
    const event = ReconciliationEvents.ReconciliationStarted(
      command.reconciliation_id,
      eventData,
      command.tenant_id,
      command.user_id,
      command.correlation_id || crypto.randomUUID()
    );

    // Append to event store
    await this.eventStore.append(event);

    // Publish to event bus for projections and saga orchestration
    await this.eventBus.publish(
      new ReconciliationStartedDomainEvent(
        command.reconciliation_id,
        command.job_id,
        event.metadata.correlation_id,
        command.tenant_id,
        command.date_range,
        command.source_adapter === 'shopify' ? { adapter: command.source_adapter } : undefined,
        command.target_adapter === 'stripe' ? { adapter: command.target_adapter } : undefined
      )
    );
  }

  async handleRetryReconciliation(command: RetryReconciliationCommand): Promise<void> {
    // Get existing events to determine current state
    const events = await this.eventStore.getEvents(
      command.reconciliation_id,
      'reconciliation'
    );

    if (events.length === 0) {
      throw new Error('Reconciliation not found');
    }

    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      throw new Error('Reconciliation not found');
    }
    const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;

    // Create retry event (could be a new event type)
    const retryEventData: ReconciliationStartedData = {
      reconciliation_id: command.reconciliation_id,
      job_id: (lastEvent.data as any).job_id,
      source_adapter: (lastEvent.data as any).source_adapter,
      target_adapter: (lastEvent.data as any).target_adapter,
      date_range: (lastEvent.data as any).date_range,
    };
    if (command.user_id) {
      retryEventData.initiated_by = command.user_id;
    }
    const retryEvent = ReconciliationEvents.ReconciliationStarted(
      command.reconciliation_id,
      retryEventData,
      command.tenant_id,
      command.user_id,
      correlationId
    );

    await this.eventStore.append(retryEvent);
    await this.eventBus.publish(
      new ReconciliationRetryDomainEvent(command.reconciliation_id, correlationId)
    );
  }

  async handleCancelReconciliation(command: CancelReconciliationCommand): Promise<void> {
    const events = await this.eventStore.getEvents(
      command.reconciliation_id,
      'reconciliation'
    );

    if (events.length === 0) {
      throw new Error('Reconciliation not found');
    }

    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      throw new Error('Reconciliation not found');
    }
    const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;

    const cancelEvent = ReconciliationEvents.ReconciliationFailed(
      command.reconciliation_id,
      {
        reconciliation_id: command.reconciliation_id,
        error: {
          type: 'CancellationError',
          message: command.reason || 'Reconciliation cancelled by user',
        },
        failed_at: new Date().toISOString(),
        retryable: false,
      },
      command.tenant_id,
      correlationId
    );

    await this.eventStore.append(cancelEvent);
    await this.eventBus.publish(
      new ReconciliationCancelledDomainEvent(command.reconciliation_id, correlationId)
    );
  }

  async handlePauseReconciliation(_command: PauseReconciliationCommand): Promise<void> {
    // Similar implementation for pause
    // Would emit a ReconciliationPaused event
  }

  async handleResumeReconciliation(_command: ResumeReconciliationCommand): Promise<void> {
    // Similar implementation for resume
    // Would emit a ReconciliationResumed event
  }
}

// Domain events for event bus (simplified)
class ReconciliationStartedDomainEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly jobId: string,
    public readonly correlationId: string,
    public readonly tenantId: string,
    public readonly dateRange?: { start: string; end: string },
    public readonly shopifyConfig?: Record<string, unknown>,
    public readonly stripeConfig?: Record<string, unknown>,
    public readonly matchingRules?: Record<string, unknown>
  ) {
    super();
  }

  get eventName(): string {
    return 'reconciliation.started';
  }
}

class ReconciliationRetryDomainEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly correlationId: string
  ) {
    super();
  }

  get eventName(): string {
    return 'reconciliation.retry';
  }
}

class ReconciliationCancelledDomainEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly correlationId: string
  ) {
    super();
  }

  get eventName(): string {
    return 'reconciliation.cancelled';
  }
}
