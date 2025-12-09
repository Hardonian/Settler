"use strict";
/**
 * Reconciliation Command Handlers
 * Handle commands and emit events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationCommandHandlers = void 0;
const ReconciliationEvents_1 = require("../../../domain/eventsourcing/reconciliation/ReconciliationEvents");
const DomainEvent_1 = require("../../../domain/events/DomainEvent");
class ReconciliationCommandHandlers {
    eventStore;
    eventBus;
    constructor(eventStore, eventBus) {
        this.eventStore = eventStore;
        this.eventBus = eventBus;
    }
    async handleStartReconciliation(command) {
        // Validate permissions and input
        // In a real implementation, check tenant permissions, job exists, etc.
        // Create and emit ReconciliationStarted event
        const eventData = {
            reconciliation_id: command.reconciliation_id,
            job_id: command.job_id,
            source_adapter: command.source_adapter,
            target_adapter: command.target_adapter,
            date_range: command.date_range,
        };
        if (command.user_id) {
            eventData.initiated_by = command.user_id;
        }
        const event = ReconciliationEvents_1.ReconciliationEvents.ReconciliationStarted(command.reconciliation_id, eventData, command.tenant_id, command.user_id, command.correlation_id || crypto.randomUUID());
        // Append to event store
        await this.eventStore.append(event);
        // Publish to event bus for projections and saga orchestration
        await this.eventBus.publish(new ReconciliationStartedDomainEvent(command.reconciliation_id, command.job_id, event.metadata.correlation_id, command.tenant_id, command.date_range, command.source_adapter === 'shopify' ? { adapter: command.source_adapter } : undefined, command.target_adapter === 'stripe' ? { adapter: command.target_adapter } : undefined));
    }
    async handleRetryReconciliation(command) {
        // Get existing events to determine current state
        const events = await this.eventStore.getEvents(command.reconciliation_id, 'reconciliation');
        if (events.length === 0) {
            throw new Error('Reconciliation not found');
        }
        const lastEvent = events[events.length - 1];
        if (!lastEvent) {
            throw new Error('Reconciliation not found');
        }
        const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;
        // Create retry event (could be a new event type)
        const retryEventData = {
            reconciliation_id: command.reconciliation_id,
            job_id: lastEvent.data.job_id,
            source_adapter: lastEvent.data.source_adapter,
            target_adapter: lastEvent.data.target_adapter,
            date_range: lastEvent.data.date_range,
        };
        if (command.user_id) {
            retryEventData.initiated_by = command.user_id;
        }
        const retryEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationStarted(command.reconciliation_id, retryEventData, command.tenant_id, command.user_id, correlationId);
        await this.eventStore.append(retryEvent);
        await this.eventBus.publish(new ReconciliationRetryDomainEvent(command.reconciliation_id, correlationId));
    }
    async handleCancelReconciliation(command) {
        const events = await this.eventStore.getEvents(command.reconciliation_id, 'reconciliation');
        if (events.length === 0) {
            throw new Error('Reconciliation not found');
        }
        const lastEvent = events[events.length - 1];
        if (!lastEvent) {
            throw new Error('Reconciliation not found');
        }
        const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;
        const cancelEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationFailed(command.reconciliation_id, {
            reconciliation_id: command.reconciliation_id,
            error: {
                type: 'CancellationError',
                message: command.reason || 'Reconciliation cancelled by user',
            },
            failed_at: new Date().toISOString(),
            retryable: false,
        }, command.tenant_id, correlationId);
        await this.eventStore.append(cancelEvent);
        await this.eventBus.publish(new ReconciliationCancelledDomainEvent(command.reconciliation_id, correlationId));
    }
    async handlePauseReconciliation(_command) {
        // Similar implementation for pause
        // Would emit a ReconciliationPaused event
    }
    async handleResumeReconciliation(_command) {
        // Similar implementation for resume
        // Would emit a ReconciliationResumed event
    }
}
exports.ReconciliationCommandHandlers = ReconciliationCommandHandlers;
// Domain events for event bus (simplified)
class ReconciliationStartedDomainEvent extends DomainEvent_1.DomainEvent {
    reconciliationId;
    jobId;
    correlationId;
    tenantId;
    dateRange;
    shopifyConfig;
    stripeConfig;
    matchingRules;
    constructor(reconciliationId, jobId, correlationId, tenantId, dateRange, shopifyConfig, stripeConfig, matchingRules) {
        super();
        this.reconciliationId = reconciliationId;
        this.jobId = jobId;
        this.correlationId = correlationId;
        this.tenantId = tenantId;
        this.dateRange = dateRange;
        this.shopifyConfig = shopifyConfig;
        this.stripeConfig = stripeConfig;
        this.matchingRules = matchingRules;
    }
    get eventName() {
        return 'reconciliation.started';
    }
}
class ReconciliationRetryDomainEvent extends DomainEvent_1.DomainEvent {
    reconciliationId;
    correlationId;
    constructor(reconciliationId, correlationId) {
        super();
        this.reconciliationId = reconciliationId;
        this.correlationId = correlationId;
    }
    get eventName() {
        return 'reconciliation.retry';
    }
}
class ReconciliationCancelledDomainEvent extends DomainEvent_1.DomainEvent {
    reconciliationId;
    correlationId;
    constructor(reconciliationId, correlationId) {
        super();
        this.reconciliationId = reconciliationId;
        this.correlationId = correlationId;
    }
    get eventName() {
        return 'reconciliation.cancelled';
    }
}
//# sourceMappingURL=ReconciliationCommandHandlers.js.map