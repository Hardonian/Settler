"use strict";
/**
 * Reconciliation Command Handlers
 * Handle commands and emit events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationCommandHandlers = void 0;
const ReconciliationEvents_1 = require("../../../domain/eventsourcing/reconciliation/ReconciliationEvents");
const ReconciliationLifecycle_1 = require("../../../domain/eventsourcing/reconciliation/ReconciliationLifecycle");
const DomainEvent_1 = require("../../../domain/events/DomainEvent");
class ReconciliationCommandHandlers {
    eventStore;
    eventBus;
    constructor(eventStore, eventBus) {
        this.eventStore = eventStore;
        this.eventBus = eventBus;
    }
    async handleStartReconciliation(command) {
        const existingEvents = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");
        (0, ReconciliationLifecycle_1.assertTenantInvariant)(existingEvents, command.tenant_id);
        (0, ReconciliationLifecycle_1.assertCanStart)(existingEvents);
        const eventData = {
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
        const event = ReconciliationEvents_1.ReconciliationEvents.ReconciliationStarted(command.reconciliation_id, eventData, command.tenant_id, command.user_id, command.correlation_id || crypto.randomUUID());
        await this.eventStore.append(event);
        await this.eventBus.publish(new ReconciliationStartedDomainEvent(command.reconciliation_id, command.job_id, event.metadata.correlation_id, command.tenant_id, command.date_range, command.source_adapter === "shopify" ? { adapter: command.source_adapter } : undefined, command.target_adapter === "stripe" ? { adapter: command.target_adapter } : undefined));
    }
    async handleRetryReconciliation(command) {
        const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");
        (0, ReconciliationLifecycle_1.assertTenantInvariant)(events, command.tenant_id);
        (0, ReconciliationLifecycle_1.assertCanRetry)(events);
        const lastEvent = events[events.length - 1];
        if (!lastEvent) {
            throw new Error("Reconciliation not found");
        }
        const latestStartedExecution = (0, ReconciliationLifecycle_1.getLatestStartedExecution)(events);
        if (!latestStartedExecution) {
            throw new Error("Reconciliation invariant violation: missing started execution data");
        }
        const correlationId = command.correlation_id || crypto.randomUUID();
        const retryEventData = {
            reconciliation_id: command.reconciliation_id,
            job_id: latestStartedExecution.job_id,
            source_adapter: latestStartedExecution.source_adapter,
            target_adapter: latestStartedExecution.target_adapter,
            date_range: latestStartedExecution.date_range,
            execution_id: command.execution_id || crypto.randomUUID(),
            attempt_number: (0, ReconciliationLifecycle_1.countExecutionAttempts)(events) + 1,
            execution_kind: "retry",
            retry_of_execution_id: latestStartedExecution.execution_id,
        };
        if (command.user_id) {
            retryEventData.initiated_by = command.user_id;
        }
        const retryEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationStarted(command.reconciliation_id, retryEventData, command.tenant_id, command.user_id, correlationId);
        await this.eventStore.append(retryEvent);
        await this.eventBus.publish(new ReconciliationRetryDomainEvent(command.reconciliation_id, correlationId));
    }
    async handleCancelReconciliation(command) {
        const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");
        (0, ReconciliationLifecycle_1.assertTenantInvariant)(events, command.tenant_id);
        (0, ReconciliationLifecycle_1.assertCanCancel)(events);
        const lastEvent = events[events.length - 1];
        if (!lastEvent) {
            throw new Error("Reconciliation not found");
        }
        const correlationId = command.correlation_id || lastEvent.metadata.correlation_id;
        const cancelEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationFailed(command.reconciliation_id, {
            reconciliation_id: command.reconciliation_id,
            error: {
                type: "CancellationError",
                message: command.reason || "Reconciliation cancelled by user",
            },
            failed_at: new Date().toISOString(),
            retryable: false,
        }, command.tenant_id, correlationId);
        await this.eventStore.append(cancelEvent);
        await this.eventBus.publish(new ReconciliationCancelledDomainEvent(command.reconciliation_id, correlationId));
    }
    async handlePauseReconciliation(command) {
        const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");
        (0, ReconciliationLifecycle_1.assertTenantInvariant)(events, command.tenant_id);
        (0, ReconciliationLifecycle_1.assertCanPause)(events);
        const correlationId = command.correlation_id || crypto.randomUUID();
        const pauseEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationPaused(command.reconciliation_id, {
            reconciliation_id: command.reconciliation_id,
            paused_at: new Date().toISOString(),
            reason: command.reason,
        }, command.tenant_id, command.user_id, correlationId);
        await this.eventStore.append(pauseEvent);
        await this.eventBus.publish(new ReconciliationPausedDomainEvent(command.reconciliation_id, correlationId));
    }
    async handleResumeReconciliation(command) {
        const events = await this.eventStore.getEvents(command.reconciliation_id, "reconciliation");
        (0, ReconciliationLifecycle_1.assertTenantInvariant)(events, command.tenant_id);
        (0, ReconciliationLifecycle_1.assertCanResume)(events);
        const correlationId = command.correlation_id || crypto.randomUUID();
        const resumeEvent = ReconciliationEvents_1.ReconciliationEvents.ReconciliationResumed(command.reconciliation_id, {
            reconciliation_id: command.reconciliation_id,
            resumed_at: new Date().toISOString(),
        }, command.tenant_id, command.user_id, correlationId);
        await this.eventStore.append(resumeEvent);
        await this.eventBus.publish(new ReconciliationResumedDomainEvent(command.reconciliation_id, correlationId));
    }
}
exports.ReconciliationCommandHandlers = ReconciliationCommandHandlers;
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
        return "reconciliation.started";
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
        return "reconciliation.retry";
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
        return "reconciliation.cancelled";
    }
}
class ReconciliationPausedDomainEvent extends DomainEvent_1.DomainEvent {
    reconciliationId;
    correlationId;
    constructor(reconciliationId, correlationId) {
        super();
        this.reconciliationId = reconciliationId;
        this.correlationId = correlationId;
    }
    get eventName() {
        return "reconciliation.paused";
    }
}
class ReconciliationResumedDomainEvent extends DomainEvent_1.DomainEvent {
    reconciliationId;
    correlationId;
    constructor(reconciliationId, correlationId) {
        super();
        this.reconciliationId = reconciliationId;
        this.correlationId = correlationId;
    }
    get eventName() {
        return "reconciliation.resumed";
    }
}
//# sourceMappingURL=ReconciliationCommandHandlers.js.map