import { mapCanonicalListItemToApiRunsLegacyRow } from "./api-runs-list-adapter.js";
import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";

const baseConfigDrift = {
  status: "none" as const,
  strategyChanged: false,
  templateChanged: false,
  validationRulesChanged: false,
  adapter: {
    status: "none" as const,
    comparisonMode: "unavailable" as const,
    sourceChanged: null as boolean | null,
    targetChanged: null as boolean | null,
    sourceHashPresent: false,
    targetHashPresent: false,
  },
  notes: [] as string[],
};

describe("mapCanonicalListItemToApiRunsLegacyRow", () => {
  it("maps recon_job row with legacy configDrift adapter label", () => {
    const row: CanonicalReconciliationListItem = {
      runKind: "recon_job",
      id: "j1",
      tenantId: "t1",
      name: "Job",
      reconResultId: "r1",
      configDrift: {
        ...baseConfigDrift,
        adapter: {
          ...baseConfigDrift.adapter,
          sourceChanged: true,
          targetChanged: false,
        },
      },
      lifecycle: {
        status: "completed",
        statusLabel: "Completed",
        isTerminal: true,
        progressPercent: 100,
        progressState: "completed",
      },
      summaryState: "success",
      summary: {
        total: 2,
        sourceCount: 1,
        targetCount: 1,
        processed: 2,
        matched: 1,
        matchedWithTolerance: 0,
        unmatched: 0,
        unmatchedSourceCount: 0,
        unmatchedTargetCount: 0,
        conflicts: 0,
        exceptioned: 0,
        unresolved: 0,
        ignored: 0,
        resolved: 0,
      },
      provenance: {
        sourceModel: "recon_jobs",
        runKind: "recon_job",
        ingestionId: null,
        reconJobId: "j1",
      },
      adapters: { sourceAdapter: "s", targetAdapter: "t" },
      timestamps: {
        createdAt: "2024-01-01T00:00:00.000Z",
        startedAt: "2024-01-01T00:00:01.000Z",
        completedAt: "2024-01-01T00:00:02.000Z",
        updatedAt: "2024-01-01T00:00:02.000Z",
      },
    };
    const legacy = mapCanonicalListItemToApiRunsLegacyRow(row);
    expect(legacy.runKind).toBe("recon_job");
    expect(legacy.configDrift.adapter).toBe("source");
    expect(legacy.ingestionId).toBeNull();
  });
});
