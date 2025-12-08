/**
 * Event Projection Service
 * Wires up event handlers to update projections
 */

import { IEventBus } from "../../infrastructure/events/IEventBus";
import { IEventStore } from "../../infrastructure/eventsourcing/EventStore";
import { ReconciliationProjectionHandlers } from "../cqrs/projections/ReconciliationProjections";
import { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";
import { DomainEvent } from "../../domain/events/DomainEvent";

interface ReconciliationEvent extends DomainEvent {
  reconciliationId?: string;
}

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
    // Subscribe to domain events from event bus
    this.eventBus.subscribe("reconciliation.started", async (event: DomainEvent) => {
      // Fetch full event from event store
      const reconciliationEvent = event as ReconciliationEvent;
      const reconciliationId = reconciliationEvent.reconciliationId;
      if (!reconciliationId) {
        return;
      }

      const events = await this.eventStore.getEvents(
        reconciliationId,
        "reconciliation"
      );
      const startedEvent = events.find((e) => e.event_type === "ReconciliationStarted");
      if (startedEvent) {
        await this.projectionHandlers.handleReconciliationStarted(event);
      }
    });

    // Subscribe to event store events (for direct event envelope handling)
    // In production, you might use a separate event stream processor
  }

  /**
   * Process event envelope and update projections
   */
  async processEvent(eventEnvelope: EventEnvelope): Promise<void> {
    switch (eventEnvelope.event_type) {
      case "ReconciliationStarted":
        await this.projectionHandlers.handleReconciliationStarted(eventEnvelope as DomainEvent);
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
