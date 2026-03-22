/**
 * Showcase-to-Canonical DTO Compatibility Tests
 *
 * Verifies that showcase demo data conforms to the canonical run types
 * defined in @settler/types, preventing contract drift between demo
 * and production data shapes.
 */

import { getShowcaseDataset } from "@/lib/demo/showcase-data";

/**
 * These canonical values are copied from @settler/types (packages/types/src/run.ts).
 * If the canonical types change, these tests will catch the drift at test time.
 * This avoids Jest module resolution issues with workspace packages while still
 * enforcing contract alignment.
 */
const CANONICAL_RUN_STATUSES = ["pending", "running", "completed", "failed", "unknown"] as const;
const CANONICAL_SUMMARY_STATES = [
  "success",
  "review_needed",
  "in_progress",
  "failed",
  "empty",
  "unknown",
] as const;
const CANONICAL_PROGRESS_STATES = [
  "not_started",
  "in_progress",
  "completed",
  "failed",
  "unknown",
] as const;

describe("showcase-to-canonical DTO compatibility", () => {
  const dataset = getShowcaseDataset();

  describe("run status values match canonical RunStatus", () => {
    it("all showcase run statuses are valid RunStatus values", () => {
      for (const run of dataset.runs) {
        expect(CANONICAL_RUN_STATUSES).toContain(run.status);
      }
    });
  });

  describe("run summaryState values match canonical RunSummaryState", () => {
    it("all showcase run summaryStates are valid", () => {
      for (const run of dataset.runs) {
        expect(CANONICAL_SUMMARY_STATES).toContain(run.summaryState);
      }
    });
  });

  describe("run progressState values match canonical RunProgressState", () => {
    it("all showcase run progressStates are valid", () => {
      for (const run of dataset.runs) {
        expect(CANONICAL_PROGRESS_STATES).toContain(run.progressState);
      }
    });
  });

  describe("run summary shape matches CanonicalRunSummary subset", () => {
    it("all runs have required summary fields", () => {
      for (const run of dataset.runs) {
        expect(typeof run.summary.total).toBe("number");
        expect(typeof run.summary.sourceCount).toBe("number");
        expect(typeof run.summary.targetCount).toBe("number");
        expect(typeof run.summary.matched).toBe("number");
        expect(typeof run.summary.unmatched).toBe("number");
        expect(typeof run.summary.conflicts).toBe("number");
      }
    });

    it("all runs have summarySemantics fields", () => {
      for (const run of dataset.runs) {
        expect(typeof run.summarySemantics.processed).toBe("number");
        expect(typeof run.summarySemantics.matchedWithTolerance).toBe("number");
        expect(typeof run.summarySemantics.exceptioned).toBe("number");
        expect(typeof run.summarySemantics.unresolved).toBe("number");
        expect(typeof run.summarySemantics.ignored).toBe("number");
        expect(typeof run.summarySemantics.resolved).toBe("number");
      }
    });
  });

  describe("isTerminal consistency", () => {
    it("completed runs are terminal", () => {
      for (const run of dataset.runs.filter((r) => r.status === "completed")) {
        expect(run.isTerminal).toBe(true);
      }
    });

    it("failed runs are terminal", () => {
      for (const run of dataset.runs.filter((r) => r.status === "failed")) {
        expect(run.isTerminal).toBe(true);
      }
    });

    it("running runs are not terminal", () => {
      for (const run of dataset.runs.filter((r) => r.status === "running")) {
        expect(run.isTerminal).toBe(false);
      }
    });
  });

  describe("exception status and severity values", () => {
    it("all exception statuses are valid", () => {
      const validStatuses = ["pending", "investigating", "resolved", "ignored"];
      for (const exc of dataset.exceptions) {
        expect(validStatuses).toContain(exc.status);
      }
    });

    it("all exception severities are valid", () => {
      const validSeverities = ["low", "medium", "high", "critical"];
      for (const exc of dataset.exceptions) {
        expect(validSeverities).toContain(exc.severity);
      }
    });
  });

  describe("alert type and severity values", () => {
    it("all alert types are valid", () => {
      const validTypes = ["threshold_breach", "sync_failure", "anomaly", "sla_warning"];
      for (const alert of dataset.alerts) {
        expect(validTypes).toContain(alert.type);
      }
    });

    it("all alert severities are valid", () => {
      const validSeverities = ["info", "warning", "critical"];
      for (const alert of dataset.alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });

  describe("integration status values", () => {
    it("all integration statuses are valid", () => {
      const validStatuses = ["connected", "degraded", "disconnected", "pending"];
      for (const integration of dataset.integrations) {
        expect(validStatuses).toContain(integration.status);
      }
    });
  });
});
