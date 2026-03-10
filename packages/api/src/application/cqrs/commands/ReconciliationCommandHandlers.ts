/**
 * Reconciliation Command Handlers
 * Handle commands and emit events
 */

import { IEventStore } from "../../../infrastructure/eventsourcing/EventStore";
import {
  StartReconciliationCommand,
  RetryReconciliationCommand,
  CancelReconciliationCommand,
  PauseReconciliationCommand,
  ResumeReconciliationCommand,
} from "./ReconciliationCommands";
import {
  ReconciliationEvents,
  ReconciliationStartedData,
} from "../../../domain/eventsourcing/reconciliation/ReconciliationEvents";
import {
  assertCanCancel,
  assertCanPause,
  assertCanResume,
  assertCanRetry,
  assertCanStart,
  assertTenantInvariant,
  countExecutionAttempts,
  getLatestStartedExecution,
} from "../../../domain/eventsourcing/reconciliation/ReconciliationLifecycle";
import { IEventBus } from "../../../infrastructure/events/IEventBus";
import { DomainEvent } from "../../../domain/events/DomainEvent";

export class ReconciliationCommandHandlers {
  constructor(
    private eventStore: IEventStore,
    private eventBus: IEventBus
  ) {}

  async handleStartReconciliation(command: StartReconciliationCommand): Promise<void> {
    const existingEvents = await this.eventStore.getEvents(
      command.reconciliation_id,
      "reconciliation"
    );
    assertTenantInvariant(existingEvents, command.tenant_id);
    assertCanStart(existingEvents);

    const eventData: ReconciliationStartedData = {
      reconciliation_id: command.reconciliation_id,
      job_id: command.job_id,
      source_adapter: command.source_adapter,
      target_adapter: command.target_adapter,
      date_range: command.date_range,
      execution_id: command.execution_id || crypto.randomUUID(),
      attempt_number: 1,
      execution_kind: "initial",
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

    await this.eventStore.append(event);

    await this.eventBus.publish(
      new ReconciliationStartedDomainEvent(
        command.reconciliation_id,
        command.job_id,
        event.metadata.correlation_id,
        command.tenant_id,
        command.date_range,
        command.source_adapter === "shopify" ? { adapter: command.source_adapter } : undefined,
        command.target_adapter === "stripe" ? { adapter: command.target_adapter } : undefined
      )
    );
  }

  async handleRetryReconciliation(command: RetryReconciliationCommand): Promise<void> {
    const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");

    assertTenantInvariant(events, command.tenant_id);
    assertCanRetry(events);

    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      throw new Error("Reconciliation not found");
    }

    const latestStartedExecution = getLatestStartedExecution(events);
    if (!latestStartedExecution) {
      throw new Error("Reconciliation invariant violation: missing started execution data");
    }

    const correlationId = command.correlation_id || crypto.randomUUID();

    const retryEventData: ReconciliationStartedData = {
      reconciliation_id: command.reconciliation_id,
      job_id: latestStartedExecution.job_id,
      source_adapter: latestStartedExecution.source_adapter,
      target_adapter: latestStartedExecution.target_adapter,
      date_range: latestStartedExecution.date_range,
      execution_id: command.execution_id || crypto.randomUUID(),
      attempt_number: countExecutionAttempts(events) + 1,
      execution_kind: "retry",
      retry_of_execution_id: latestStartedExecution.execution_id,
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
    const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");

    assertTenantInvariant(events, command.tenant_id);
    assertCanCancel(events);

    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      throw new Error("Reconciliation not found");
    }
    const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;

    const cancelEvent = ReconciliationEvents.ReconciliationFailed(
      command.reconciliation_id,
      {
        reconciliation_id: command.reconciliation_id,
        error: {
          type: "CancellationError",
          message: command.reason || "Reconciliation cancelled by user",
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

  async handlePauseReconciliation(command: PauseReconciliationCommand): Promise<void> {
    const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");

    assertTenantInvariant(events, command.tenant_id);
    assertCanPause(events);

    const correlationId = command.correlation_id || crypto.randomUUID();
    const pauseEvent = ReconciliationEvents.ReconciliationPaused(
      command.reconciliation_id,
      {
        reconciliation_id: command.reconciliation_id,
        paused_at: new Date().toISOString(),
        reason: command.reason,
      },
      command.tenant_id,
      command.user_id,
      correlationId
    );

    await this.eventStore.append(pauseEvent);
    await this.eventBus.publish(
      new ReconciliationPausedDomainEvent(command.reconciliation_id, correlationId)
    );
  }

  async handleResumeReconciliation(command: ResumeReconciliationCommand): Promise<void> {
    const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");

    assertTenantInvariant(events, command.tenant_id);
    assertCanResume(events);

    const correlationId = command.correlation_id || crypto.randomUUID();
    const resumeEvent = ReconciliationEvents.ReconciliationResumed(
      command.reconciliation_id,
      {
        reconciliation_id: command.reconciliation_id,
        resumed_at: new Date().toISOString(),
      },
      command.tenant_id,
      command.user_id,
      correlationId
    );

    await this.eventStore.append(resumeEvent);
    await this.eventBus.publish(
      new ReconciliationResumedDomainEvent(command.reconciliation_id, correlationId)
    );
  }
}

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
    return "reconciliation.started";
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
    return "reconciliation.retry";
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
    return "reconciliation.cancelled";
  }
}

class ReconciliationPausedDomainEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly correlationId: string
  ) {
    super();
  }

  get eventName(): string {
    return "reconciliation.paused";
  }
}

class ReconciliationResumedDomainEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly correlationId: string
  ) {
    super();
  }

  get eventName(): string {
    return "reconciliation.resumed";
  }
}
