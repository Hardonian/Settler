/**
 * Determinism Enforcement
 *
 * Ensures all subsystems maintain deterministic guarantees.
 * Audits for common violations: timestamps, random IDs, AI mutations,
 * connector non-determinism, and concurrent state races.
 */

import crypto from "node:crypto";

// ────────────────────────────────────────────────────────────
// Deterministic ID generation (seeded)
// ────────────────────────────────────────────────────────────
export function deterministicId(namespace: string, ...parts: string[]): string {
  return crypto
    .createHash("sha256")
    .update(`${namespace}:${parts.join(":")}`)
    .digest("hex");
}

// ────────────────────────────────────────────────────────────
// Determinism Violation types
// ────────────────────────────────────────────────────────────
export type ViolationType =
  | "timestamp_in_deterministic_path"
  | "random_id_in_deterministic_path"
  | "ai_modified_execution_state"
  | "connector_non_deterministic_output"
  | "concurrent_state_mutation"
  | "non_deterministic_sort"
  | "floating_point_comparison";

export interface DeterminismViolation {
  violationType: ViolationType;
  subsystem: string;
  location: string;
  description: string;
  severity: "critical" | "warning" | "info";
  detectedAt: string;
}

// ────────────────────────────────────────────────────────────
// Determinism Auditor
// ────────────────────────────────────────────────────────────
export class DeterminismAuditor {
  private violations: DeterminismViolation[] = [];

  /**
   * Check that a value does not contain wall-clock timestamps
   * in deterministic execution paths
   */
  assertNoTimestampInDeterministicPath(value: unknown, subsystem: string, location: string): void {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    // ISO timestamps
    const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    // Unix epoch ms
    const epochPattern = /\b1[6-9]\d{11}\b/;

    if (isoPattern.test(serialized) || epochPattern.test(serialized)) {
      this.violations.push({
        violationType: "timestamp_in_deterministic_path",
        subsystem,
        location,
        description: "Wall-clock timestamp detected in deterministic execution path",
        severity: "critical",
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Check that connector output is normalized and does not contain
   * non-deterministic elements
   */
  assertConnectorOutputDeterministic(output: Record<string, unknown>, connectorId: string): void {
    const serialized = JSON.stringify(output);
    // Check for UUID v4 patterns (random)
    const uuidV4 = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    if (uuidV4.test(serialized)) {
      this.violations.push({
        violationType: "connector_non_deterministic_output",
        subsystem: "connector",
        location: connectorId,
        description:
          "Connector output contains random UUID v4 values that break replay determinism",
        severity: "warning",
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Assert that AI never directly modifies execution state
   */
  assertAIAdvisoryOnly(action: string, mutatesState: boolean, subsystem: string): void {
    if (mutatesState) {
      this.violations.push({
        violationType: "ai_modified_execution_state",
        subsystem,
        location: action,
        description: `AI action "${action}" attempted to directly modify execution state`,
        severity: "critical",
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Verify replay produces identical fingerprint
   */
  assertReplayMatch(
    originalFingerprint: string,
    replayFingerprint: string,
    executionId: string
  ): boolean {
    const matches = originalFingerprint === replayFingerprint;
    if (!matches) {
      this.violations.push({
        violationType: "concurrent_state_mutation",
        subsystem: "replay",
        location: executionId,
        description: `Replay fingerprint mismatch: expected=${originalFingerprint} got=${replayFingerprint}`,
        severity: "critical",
        detectedAt: new Date().toISOString(),
      });
    }
    return matches;
  }

  getViolations(): DeterminismViolation[] {
    return [...this.violations];
  }

  getCriticalViolations(): DeterminismViolation[] {
    return this.violations.filter((v) => v.severity === "critical");
  }

  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  hasCriticalViolations(): boolean {
    return this.getCriticalViolations().length > 0;
  }

  reset(): void {
    this.violations = [];
  }

  report(): string {
    if (this.violations.length === 0) return "No determinism violations detected.";
    const critical = this.getCriticalViolations();
    const warnings = this.violations.filter((v) => v.severity === "warning");
    const lines = [
      `Determinism Audit Report: ${this.violations.length} violation(s)`,
      `  Critical: ${critical.length}`,
      `  Warning: ${warnings.length}`,
      "",
    ];
    for (const v of this.violations) {
      lines.push(`[${v.severity.toUpperCase()}] ${v.subsystem}::${v.location}`);
      lines.push(`  ${v.description}`);
      lines.push(`  Type: ${v.violationType}`);
      lines.push("");
    }
    return lines.join("\n");
  }
}

// ────────────────────────────────────────────────────────────
// Connector Output Normalizer
// ────────────────────────────────────────────────────────────
export function normalizeConnectorOutput<T extends Record<string, unknown>>(
  output: T,
  connectorId: string
): T {
  const serialized = JSON.stringify(output);
  // Replace random UUIDs with deterministic ones derived from content
  const normalized = serialized.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
    (match) => deterministicId("connector-normalize", connectorId, match)
  );
  return JSON.parse(normalized) as T;
}

// ────────────────────────────────────────────────────────────
// Execution Fence: prevents non-deterministic operations
// in deterministic execution blocks
// ────────────────────────────────────────────────────────────
export class DeterministicExecutionFence {
  private active = false;

  enter(): void {
    this.active = true;
  }

  exit(): void {
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Wraps a function to run within the deterministic fence.
   * Any call to assertNotInFence will throw if the fence is active.
   */
  async guard<T>(fn: () => Promise<T>): Promise<T> {
    this.enter();
    try {
      return await fn();
    } finally {
      this.exit();
    }
  }

  assertNotInFence(operation: string): void {
    if (this.active) {
      throw new Error(
        `Determinism violation: "${operation}" called inside deterministic execution fence`
      );
    }
  }
}
