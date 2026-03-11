/**
 * Event Projection Service
 * Wires up event handlers to update projections
 */

import { IEventBus } from "../../infrastructure/events/IEventBus";
import { IEventStore } from "../../infrastructure/eventsourcing/EventStore";
import { ReconciliationProjectionHandlers } from "../cqrs/projections/ReconciliationProjections";
import { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";
import { DomainEvent } from "../../domain/events/DomainEvent";
import {
  assertCompletionDataInvariant,
  assertProjectionMutationInvariant,
  assertTenantInvariant,
} from "../../domain/eventsourcing/reconciliation/ReconciliationLifecycle";

export class EventProjectionService {
  private projectionHandlers: ReconciliationProjectionHandlers;

  constructor(
    private eventBus: IEventBus,
    private eventStore: IEventStore
  ) {
    this.projectionHandlers = new ReconciliationProjectionHandlers();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.subscribe("reconciliation.started", async (event: DomainEvent) => {
      const events = await this.eventStore.getEvents(
        (event as unknown as { reconciliationId: string }).reconciliationId,
        "reconciliation"
      );
      const startedEvent = events.find((e) => e.event_type === "ReconciliationStarted");
      if (startedEvent) {
        await this.projectionHandlers.handleReconciliationStarted(event);
      }
    });
  }

  /**
   * Process event envelope and update projections
   */
  async processEvent(eventEnvelope: EventEnvelope): Promise<void> {
    if (eventEnvelope.aggregate_type === "reconciliation") {
      const history = await this.eventStore.getEvents(eventEnvelope.aggregate_id, "reconciliation");
      assertTenantInvariant(history, eventEnvelope.metadata.tenant_id);
      assertCompletionDataInvariant(eventEnvelope);
      assertProjectionMutationInvariant(history, eventEnvelope);
    }

    switch (eventEnvelope.event_type) {
      case "ReconciliationStarted":
        await this.projectionHandlers.handleReconciliationStarted(
          eventEnvelope as unknown as DomainEvent
        );
        break;
      case "ReconciliationPaused":
        await this.projectionHandlers.handleReconciliationPaused(eventEnvelope);
        break;
      case "ReconciliationResumed":
        await this.projectionHandlers.handleReconciliationResumed(eventEnvelope);
        break;
      case "OrdersFetched":
        await this.projectionHandlers.handleOrdersFetched(eventEnvelope);
        break;
      case "PaymentsFetched":
        await this.projectionHandlers.handlePaymentsFetched(eventEnvelope);
        break;
      case "RecordMatched":
        await this.projectionHandlers.handleRecordMatched(eventEnvelope);
        break;
      case "RecordUnmatched":
        await this.projectionHandlers.handleRecordUnmatched(eventEnvelope);
        break;
      case "ReconciliationCompleted":
        await this.projectionHandlers.handleReconciliationCompleted(eventEnvelope);
        break;
      case "ReconciliationFailed":
        await this.projectionHandlers.handleReconciliationFailed(eventEnvelope);
        break;
    }
  }
}
