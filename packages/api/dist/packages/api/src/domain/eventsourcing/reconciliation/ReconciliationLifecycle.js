"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationTransitionError = void 0;
exports.deriveReconciliationLifecycle = deriveReconciliationLifecycle;
exports.countExecutionAttempts = countExecutionAttempts;
exports.getLatestStartedExecution = getLatestStartedExecution;
exports.assertCanStart = assertCanStart;
exports.assertCanRetry = assertCanRetry;
exports.assertCanCancel = assertCanCancel;
exports.assertCanPause = assertCanPause;
exports.assertCanResume = assertCanResume;
exports.assertTenantInvariant = assertTenantInvariant;
exports.assertCompletionDataInvariant = assertCompletionDataInvariant;
exports.assertProjectionMutationInvariant = assertProjectionMutationInvariant;
class ReconciliationTransitionError extends Error {
    currentState;
    attemptedAction;
    code = "INVALID_RECONCILIATION_TRANSITION";
    constructor(message, currentState, attemptedAction) {
        super(message);
        this.currentState = currentState;
        this.attemptedAction = attemptedAction;
        this.name = "ReconciliationTransitionError";
    }
}
exports.ReconciliationTransitionError = ReconciliationTransitionError;
const START_EVENTS = new Set(["ReconciliationStarted", "reconciliation.started"]);
const RESUME_EVENTS = new Set(["ReconciliationResumed", "reconciliation.resumed"]);
const PAUSED_EVENTS = new Set(["ReconciliationPaused", "reconciliation.paused"]);
const COMPLETED_EVENTS = new Set(["ReconciliationCompleted", "reconciliation.completed"]);
const FAILED_EVENTS = new Set(["ReconciliationFailed", "reconciliation.failed"]);
const MUTATING_EVENTS = new Set([
    ...START_EVENTS,
    ...RESUME_EVENTS,
    ...PAUSED_EVENTS,
    "OrdersFetched",
    "PaymentsFetched",
    "RecordMatched",
    "RecordUnmatched",
]);
function isCancellationFailure(event) {
    if (!FAILED_EVENTS.has(event.event_type)) {
        return false;
    }
    const maybeError = event.data.error;
    return maybeError?.type === "CancellationError";
}
function deriveReconciliationLifecycle(events) {
    if (events.length === 0) {
        return "not_started";
    }
    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
        return "not_started";
    }
    if (COMPLETED_EVENTS.has(lastEvent.event_type)) {
        return "completed";
    }
    if (isCancellationFailure(lastEvent)) {
        return "cancelled";
    }
    if (FAILED_EVENTS.has(lastEvent.event_type)) {
        return "failed";
    }
    if (PAUSED_EVENTS.has(lastEvent.event_type)) {
        return "paused";
    }
    if (START_EVENTS.has(lastEvent.event_type) || RESUME_EVENTS.has(lastEvent.event_type)) {
        return "in_progress";
    }
    return "in_progress";
}
function countExecutionAttempts(events) {
    return events.filter((event) => START_EVENTS.has(event.event_type)).length;
}
function getLatestStartedExecution(events) {
    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];
        if (event && START_EVENTS.has(event.event_type)) {
            return event.data;
        }
    }
    return null;
}
function assertCanStart(events) {
    const lifecycle = deriveReconciliationLifecycle(events);
    if (lifecycle !== "not_started") {
        throw new ReconciliationTransitionError(`Cannot start reconciliation from state ${lifecycle}`, lifecycle, "start");
    }
}
function assertCanRetry(events) {
    const lifecycle = deriveReconciliationLifecycle(events);
    if (lifecycle !== "failed" && lifecycle !== "cancelled") {
        throw new ReconciliationTransitionError(`Cannot retry reconciliation from state ${lifecycle}`, lifecycle, "retry");
    }
}
function assertCanCancel(events) {
    const lifecycle = deriveReconciliationLifecycle(events);
    if (lifecycle !== "in_progress" && lifecycle !== "paused") {
        throw new ReconciliationTransitionError(`Cannot cancel reconciliation from state ${lifecycle}`, lifecycle, "cancel");
    }
}
function assertCanPause(events) {
    const lifecycle = deriveReconciliationLifecycle(events);
    if (lifecycle !== "in_progress") {
        throw new ReconciliationTransitionError(`Cannot pause reconciliation from state ${lifecycle}`, lifecycle, "pause");
    }
}
function assertCanResume(events) {
    const lifecycle = deriveReconciliationLifecycle(events);
    if (lifecycle !== "paused") {
        throw new ReconciliationTransitionError(`Cannot resume reconciliation from state ${lifecycle}`, lifecycle, "resume");
    }
}
function assertTenantInvariant(events, tenantId) {
    const mismatchedTenantEvent = events.find((event) => event.metadata.tenant_id !== tenantId);
    if (mismatchedTenantEvent) {
        throw new Error("Tenant invariant violation: reconciliation aggregate belongs to another tenant");
    }
}
function assertCompletionDataInvariant(eventEnvelope) {
    if (!COMPLETED_EVENTS.has(eventEnvelope.event_type)) {
        return;
    }
    const completedData = eventEnvelope.data;
    if (!completedData.completed_at || !completedData.finalization?.finalized_at) {
        throw new Error("Completion invariant violation: finalized reconciliation missing finalization timestamp");
    }
    if (completedData.summary.duration_ms < 0) {
        throw new Error("Completion invariant violation: reconciliation duration cannot be negative");
    }
}
function assertProjectionMutationInvariant(history, currentEvent) {
    const currentIndex = history.findIndex((event) => event.id === currentEvent.id);
    const boundedHistory = currentIndex >= 0 ? history.slice(0, currentIndex + 1) : history;
    const completedIndex = boundedHistory.findIndex((event) => COMPLETED_EVENTS.has(event.event_type));
    if (completedIndex < 0) {
        return;
    }
    const postCompletionMutation = boundedHistory
        .slice(completedIndex + 1)
        .find((event) => MUTATING_EVENTS.has(event.event_type));
    if (postCompletionMutation) {
        throw new Error(`Projection invariant violation: mutation event ${postCompletionMutation.event_type} after completion`);
    }
}
//# sourceMappingURL=ReconciliationLifecycle.js.map