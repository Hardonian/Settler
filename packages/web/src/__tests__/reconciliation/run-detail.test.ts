import { buildRunConfigurationSummary } from "@settler/reconciliation-core";

describe("run-detail helpers", () => {
  test("marks snapshot-backed configuration without drift when definitions align", () => {
    const summary = buildRunConfigurationSummary({
      sourceAdapter: "stripe",
      targetAdapter: "netsuite",
      reconStrategy: "deterministic",
      templateId: "tpl-a",
      validationRules: [{ field: "amount", tolerance: 0.01 }],
      snapshotId: "snapshot-a",
      snapshot: {
        id: "snapshot-a",
        createdAt: "2026-01-01T00:00:00.000Z",
        jobConfig: {
          reconStrategy: "deterministic",
          templateId: "tpl-a",
          validationRules: [{ field: "amount", tolerance: 0.01 }],
        },
      },
    });

    expect(summary.configSource).toBe("snapshot");
    expect(summary.definitionDriftDetected).toBe(false);
    expect(summary.definitionDriftNotes).toEqual([]);
  });

  test("flags definition drift when current job settings diverge from snapshot", () => {
    const summary = buildRunConfigurationSummary({
      reconStrategy: "ml_enhanced",
      templateId: "tpl-b",
      validationRules: [{ field: "amount", tolerance: 0.05 }],
      snapshotId: "snapshot-b",
      snapshot: {
        id: "snapshot-b",
        createdAt: "2026-01-01T00:00:00.000Z",
        jobConfig: {
          reconStrategy: "deterministic",
          templateId: "tpl-a",
          validationRules: [
            { field: "amount", tolerance: 0.01 },
            { field: "date", window: "24h" },
          ],
        },
      },
    });

    expect(summary.definitionDriftDetected).toBe(true);
    expect(summary.definitionDriftNotes).toEqual(
      expect.arrayContaining([
        "Reconciliation strategy changed since this result was captured.",
        "Template reference changed since this result was captured.",
        "Validation rule count changed since this result was captured.",
      ])
    );
  });

  test("uses job-definition mode when snapshot is unavailable", () => {
    const summary = buildRunConfigurationSummary({
      reconStrategy: "deterministic",
      validationRules: [],
    });

    expect(summary.configSource).toBe("job_definition");
    expect(summary.definitionDriftDetected).toBe(false);
    expect(summary.definitionDriftNotes).toEqual([]);
  });
});
