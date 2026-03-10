import type { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";
import {
  assertCompletionDataInvariant,
  assertProjectionMutationInvariant,
  deriveReconciliationLifecycle,
} from "../../domain/eventsourcing/reconciliation/ReconciliationLifecycle";

describe("ReconciliationLifecycle", () => {
  const makeEvent = (
    eventType: string,
    data: Record<string, unknown>,
    id: string
  ): EventEnvelope => ({
    id,
    aggregate_id: "recon-1",
    aggregate_type: "reconciliation",
    event_type: eventType,
    event_version: 1,
    data,
    metadata: {
      tenant_id: "tenant-1",
      correlation_id: "corr-1",
      timestamp: new Date().toISOString(),
    },
    created_at: new Date(),
  });

  it("derives paused and resumed states from mixed event history", () => {
    const history = [
      makeEvent("ReconciliationStarted", { execution_id: "e1" }, "1"),
      makeEvent("ReconciliationPaused", { paused_at: new Date().toISOString() }, "2"),
    ];

    expect(deriveReconciliationLifecycle(history)).toBe("paused");
    expect(
      deriveReconciliationLifecycle([...history, makeEvent("ReconciliationResumed", {}, "3")])
    ).toBe("in_progress");
  });

  it("treats unknown terminal-unrelated event as in_progress fallback", () => {
    const history = [
      makeEvent("ReconciliationStarted", { execution_id: "e1" }, "1"),
      makeEvent("UnknownEvent", {}, "2"),
    ];

    expect(deriveReconciliationLifecycle(history)).toBe("in_progress");
  });

  it("enforces completion metadata invariants", () => {
    expect(() =>
      assertCompletionDataInvariant(
        makeEvent(
          "ReconciliationCompleted",
          {
            reconciliation_id: "recon-1",
            summary: { duration_ms: -1 },
            completed_at: new Date().toISOString(),
            finalization: { finalized_at: new Date().toISOString(), finalization_source: "saga" },
          },
          "1"
        )
      )
    ).toThrow("duration cannot be negative");
  });

  it("blocks mutation events after completion in projection processing", () => {
    const completed = makeEvent(
      "ReconciliationCompleted",
      {
        reconciliation_id: "recon-1",
        summary: { duration_ms: 100 },
        completed_at: new Date().toISOString(),
        finalization: { finalized_at: new Date().toISOString(), finalization_source: "saga" },
      },
      "2"
    );

    const postCompletionMutation = makeEvent(
      "RecordMatched",
      { reconciliation_id: "recon-1" },
      "3"
    );

    expect(() =>
      assertProjectionMutationInvariant(
        [
          makeEvent("ReconciliationStarted", { execution_id: "e1" }, "1"),
          completed,
          postCompletionMutation,
        ],
        postCompletionMutation
      )
    ).toThrow("Projection invariant violation");
  });
});
