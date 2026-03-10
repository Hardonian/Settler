import { EventEnvelope } from "../EventEnvelope";
import type {
  ReconciliationCompletedData,
  ReconciliationStartedData,
} from "./ReconciliationEvents";

export type ReconciliationLifecycleState =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export class ReconciliationTransitionError extends Error {
  readonly code = "INVALID_RECONCILIATION_TRANSITION";

  constructor(
    message: string,
    public readonly currentState: ReconciliationLifecycleState,
    public readonly attemptedAction: "start" | "retry" | "cancel" | "pause" | "resume"
  ) {
    super(message);
    this.name = "ReconciliationTransitionError";
  }
}

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

function isCancellationFailure(event: EventEnvelope): boolean {
  if (!FAILED_EVENTS.has(event.event_type)) {
    return false;
  }

  const maybeError = (event.data as { error?: { type?: string } }).error;
  return maybeError?.type === "CancellationError";
}

export function deriveReconciliationLifecycle(
  events: EventEnvelope[]
): ReconciliationLifecycleState {
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

export function countExecutionAttempts(events: EventEnvelope[]): number {
  return events.filter((event) => START_EVENTS.has(event.event_type)).length;
}

export function getLatestStartedExecution(
  events: EventEnvelope[]
): ReconciliationStartedData | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && START_EVENTS.has(event.event_type)) {
      return event.data as ReconciliationStartedData;
    }
  }

  return null;
}

export function assertCanStart(events: EventEnvelope[]): void {
  const lifecycle = deriveReconciliationLifecycle(events);
  if (lifecycle !== "not_started") {
    throw new ReconciliationTransitionError(
      `Cannot start reconciliation from state ${lifecycle}`,
      lifecycle,
      "start"
    );
  }
}

export function assertCanRetry(events: EventEnvelope[]): void {
  const lifecycle = deriveReconciliationLifecycle(events);
  if (lifecycle !== "failed" && lifecycle !== "cancelled") {
    throw new ReconciliationTransitionError(
      `Cannot retry reconciliation from state ${lifecycle}`,
      lifecycle,
      "retry"
    );
  }
}

export function assertCanCancel(events: EventEnvelope[]): void {
  const lifecycle = deriveReconciliationLifecycle(events);
  if (lifecycle !== "in_progress" && lifecycle !== "paused") {
    throw new ReconciliationTransitionError(
      `Cannot cancel reconciliation from state ${lifecycle}`,
      lifecycle,
      "cancel"
    );
  }
}

export function assertCanPause(events: EventEnvelope[]): void {
  const lifecycle = deriveReconciliationLifecycle(events);
  if (lifecycle !== "in_progress") {
    throw new ReconciliationTransitionError(
      `Cannot pause reconciliation from state ${lifecycle}`,
      lifecycle,
      "pause"
    );
  }
}

export function assertCanResume(events: EventEnvelope[]): void {
  const lifecycle = deriveReconciliationLifecycle(events);
  if (lifecycle !== "paused") {
    throw new ReconciliationTransitionError(
      `Cannot resume reconciliation from state ${lifecycle}`,
      lifecycle,
      "resume"
    );
  }
}

export function assertTenantInvariant(events: EventEnvelope[], tenantId: string): void {
  const mismatchedTenantEvent = events.find((event) => event.metadata.tenant_id !== tenantId);
  if (mismatchedTenantEvent) {
    throw new Error(
      "Tenant invariant violation: reconciliation aggregate belongs to another tenant"
    );
  }
}

export function assertCompletionDataInvariant(eventEnvelope: EventEnvelope): void {
  if (!COMPLETED_EVENTS.has(eventEnvelope.event_type)) {
    return;
  }

  const completedData = eventEnvelope.data as ReconciliationCompletedData;
  if (!completedData.completed_at || !completedData.finalization?.finalized_at) {
    throw new Error(
      "Completion invariant violation: finalized reconciliation missing finalization timestamp"
    );
  }

  if (completedData.summary.duration_ms < 0) {
    throw new Error("Completion invariant violation: reconciliation duration cannot be negative");
  }
}

export function assertProjectionMutationInvariant(
  history: EventEnvelope[],
  currentEvent: EventEnvelope
): void {
  const currentIndex = history.findIndex((event) => event.id === currentEvent.id);
  const boundedHistory = currentIndex >= 0 ? history.slice(0, currentIndex + 1) : history;

  const completedIndex = boundedHistory.findIndex((event) =>
    COMPLETED_EVENTS.has(event.event_type)
  );
  if (completedIndex < 0) {
    return;
  }

  const postCompletionMutation = boundedHistory
    .slice(completedIndex + 1)
    .find((event) => MUTATING_EVENTS.has(event.event_type));

  if (postCompletionMutation) {
    throw new Error(
      `Projection invariant violation: mutation event ${postCompletionMutation.event_type} after completion`
    );
  }
}
