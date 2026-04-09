import { createHash } from "node:crypto";

export interface AdvisoryPolicyMetadata {
  disclaimer: string;
  nonAuthoritative: true;
  requiresHumanApprovalForFinancialPosting: true;
  allowLedgerMutation: false;
  provenance: {
    provider: string;
    model: string;
    modelVersion: string;
    generatedAt: string;
    inputFingerprint: string;
  };
}

const BLOCKED_ACTIONS = new Set([
  "post_ledger_entry",
  "mutate_ledger",
  "approve_financial_posting",
  "create_journal_entry",
  "autonomous_posting",
]);

const ADVISORY_DISCLAIMER =
  "AI advisory output is non-authoritative guidance only and must not be used to autonomously post or mutate financial ledger records.";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);

  return `{${entries.join(",")}}`;
}

export function assertNoAutonomousFinancialAction(payload: Record<string, unknown>): void {
  const requestedAction = payload.requestedAction;
  if (typeof requestedAction === "string" && BLOCKED_ACTIONS.has(requestedAction)) {
    throw new Error("Autonomous financial ledger mutations are prohibited in advisory endpoints.");
  }
}

export function buildAdvisoryPolicyMetadata(
  input: Record<string, unknown>
): AdvisoryPolicyMetadata {
  const fingerprint = createHash("sha256").update(stableStringify(input)).digest("hex");

  return {
    disclaimer: ADVISORY_DISCLAIMER,
    nonAuthoritative: true,
    requiresHumanApprovalForFinancialPosting: true,
    allowLedgerMutation: false,
    provenance: {
      provider: "settler",
      model: "rule-based-advisory",
      modelVersion: "2026-02-redteam-controls",
      generatedAt: new Date().toISOString(),
      inputFingerprint: fingerprint,
    },
  };
}
