/**
 * Trust Envelope v1
 *
 * Produces and verifies {@link ReconciliationProofCapsule} objects.
 * Every reconciliation run is sealed into a capsule that captures
 * deterministic hashes of its inputs, rules, outputs, and engine version.
 * An optional HMAC signature makes the capsule tamper-evident.
 */

import { createHmac } from "node:crypto";
import {
  stableHash,
  type ReconciliationProofCapsule,
} from "@settler/protocol";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SealInput {
  /** Unique job / run identifier. */
  jobId: string;

  /** Transactions fed into the reconciliation engine. */
  sourceTransactions: ReadonlyArray<{
    id: string;
    amount: number;
    date: string; // ISO 8601
    currency: string;
  }>;

  /** Transactions the source is reconciled against. */
  targetTransactions: ReadonlyArray<{
    id: string;
    amount: number;
    date: string; // ISO 8601
    currency: string;
  }>;

  /** Tenant scoping the run. */
  tenantId: string;

  /** Matching rules applied during reconciliation. */
  rules: Record<string, unknown>;

  /**
   * Sorted match results produced by the reconciliation engine.
   * Must already be sorted by `sourceTransactionId` for determinism.
   */
  matches: ReadonlyArray<unknown>;

  /** Engine name + version + build SHA for the version hash. */
  engine: {
    name: string;
    version: string;
    build: string;
  };
}

export interface SealOptions {
  /**
   * HMAC secret used to sign the capsule.
   * When omitted the capsule is produced without a signature.
   */
  hmacSecret?: string;

  /** Identity of the signing entity (e.g. "Settler-Core"). */
  signer?: string;
}

export interface VerifyResult {
  /** Whether all hashes and (if present) the signature are valid. */
  valid: boolean;

  /** Individual check results. */
  checks: {
    inputHash: boolean;
    ruleHash: boolean;
    outputHash: boolean;
    versionHash: boolean;
    signature: boolean | null; // null when no signature present
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildInputHash(input: SealInput): string {
  return stableHash({
    tenantId: input.tenantId,
    sourceTransactions: input.sourceTransactions,
    targetTransactions: input.targetTransactions,
  });
}

function buildRuleHash(rules: Record<string, unknown>): string {
  return stableHash(rules);
}

function buildOutputHash(
  matches: ReadonlyArray<unknown>
): string {
  return stableHash(matches);
}

function buildVersionHash(engine: SealInput["engine"]): string {
  return stableHash(engine);
}

/**
 * Compute HMAC-SHA256 over the four content hashes of a capsule.
 */
function computeSignature(
  capsule: Pick<
    ReconciliationProofCapsule,
    "inputHash" | "ruleHash" | "outputHash" | "versionHash"
  >,
  secret: string
): string {
  const payload = [
    capsule.inputHash,
    capsule.ruleHash,
    capsule.outputHash,
    capsule.versionHash,
  ].join(":");

  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seal a reconciliation run into a {@link ReconciliationProofCapsule}.
 *
 * The capsule captures deterministic hashes of the run's inputs, matching
 * rules, outputs, and engine version. If an `hmacSecret` is provided the
 * four hashes are additionally signed with HMAC-SHA256 so downstream
 * consumers can verify the capsule has not been tampered with.
 */
export function seal(
  input: SealInput,
  options: SealOptions = {}
): ReconciliationProofCapsule {
  const inputHash = buildInputHash(input);
  const ruleHash = buildRuleHash(input.rules);
  const outputHash = buildOutputHash(input.matches);
  const versionHash = buildVersionHash(input.engine);

  const capsule: ReconciliationProofCapsule = {
    capsuleVersion: "1.0.0",
    jobId: input.jobId,
    inputHash,
    ruleHash,
    outputHash,
    versionHash,
    createdAt: new Date().toISOString(),
  };

  if (options.hmacSecret) {
    capsule.signature = computeSignature(capsule, options.hmacSecret);
    capsule.signer = options.signer ?? "Settler-Core";
  }

  return capsule;
}

/**
 * Verify a {@link ReconciliationProofCapsule} against the original inputs.
 *
 * Re-derives every hash from scratch and compares it to the values stored
 * in the capsule. When the capsule carries a signature the caller must
 * supply the same `hmacSecret` that was used during sealing.
 */
export function verify(
  capsule: ReconciliationProofCapsule,
  input: SealInput,
  hmacSecret?: string
): VerifyResult {
  const expectedInputHash = buildInputHash(input);
  const expectedRuleHash = buildRuleHash(input.rules);
  const expectedOutputHash = buildOutputHash(input.matches);
  const expectedVersionHash = buildVersionHash(input.engine);

  const checks: VerifyResult["checks"] = {
    inputHash: capsule.inputHash === expectedInputHash,
    ruleHash: capsule.ruleHash === expectedRuleHash,
    outputHash: capsule.outputHash === expectedOutputHash,
    versionHash: capsule.versionHash === expectedVersionHash,
    signature: null,
  };

  if (capsule.signature) {
    if (!hmacSecret) {
      checks.signature = false;
    } else {
      const expectedSig = computeSignature(capsule, hmacSecret);
      checks.signature = capsule.signature === expectedSig;
    }
  }

  const valid =
    checks.inputHash &&
    checks.ruleHash &&
    checks.outputHash &&
    checks.versionHash &&
    (checks.signature === null || checks.signature === true);

  return { valid, checks };
}
