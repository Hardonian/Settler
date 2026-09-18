/**
 * Cognitive Policy Registry & Governance State Machine
 *
 * Implements SOX-404 compliant dual-signature policy promotion for
 * Gemini 3 self-healing reconciliation plans.
 *
 * Invariant:
 * 1. Strictly tenant-scoped (tenantId required on every operation).
 * 2. Separation of duties: Checker identity MUST NOT equal Proposer identity.
 * 3. Immutable cryptographic freeze: Policy approval computes a deterministic SHA-256 certificate.
 */

import { createHash } from "node:crypto";

export type CognitivePolicyStatus = "proposed" | "controller_approved" | "active" | "rejected";

export interface CognitivePolicyProposal {
  proposalId: string;
  tenantId: string;
  rail: string;
  action: string;
  rationale: string;
  ruleHash: string;
  ruleConfig: Record<string, unknown>;
  noiseReductionPct: number;
  capitalGuardedCents: bigint;
  proposerId: string;
  proposedAt: string;
  status: CognitivePolicyStatus;
  checkerId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  immutableCertificateHash?: string;
}

export interface CreateProposalParams {
  tenantId: string;
  rail: string;
  action: string;
  rationale: string;
  ruleConfig: Record<string, unknown>;
  noiseReductionPct: number;
  capitalGuardedCents: bigint;
  proposerId: string;
}

export interface ApprovePolicyParams {
  proposal: CognitivePolicyProposal;
  checkerId: string;
  tenantId: string;
}

export interface RejectPolicyParams {
  proposal: CognitivePolicyProposal;
  checkerId: string;
  tenantId: string;
  rejectionReason: string;
}

export interface PolicyApplicationResult {
  effectiveToleranceCents: bigint;
  effectiveWindowSeconds: number;
  appliedPolicyIds: string[];
  auditHash: string;
}

/**
 * Creates a new self-healing policy proposal candidate.
 */
export function createPolicyProposal(params: CreateProposalParams): CognitivePolicyProposal {
  if (!params.tenantId || params.tenantId.trim() === "") {
    throw new Error("Tenant context invariant violation: tenantId is required");
  }
  if (!params.proposerId || params.proposerId.trim() === "") {
    throw new Error("Proposer identity invariant violation: proposerId is required");
  }

  const ruleHash = createHash("sha256")
    .update(
      JSON.stringify({
        tenantId: params.tenantId,
        rail: params.rail,
        action: params.action,
        ruleConfig: params.ruleConfig,
      })
    )
    .digest("hex");

  const proposalId = `pol_${ruleHash.slice(0, 16)}`;

  return {
    proposalId,
    tenantId: params.tenantId,
    rail: params.rail,
    action: params.action,
    rationale: params.rationale,
    ruleHash,
    ruleConfig: params.ruleConfig,
    noiseReductionPct: params.noiseReductionPct,
    capitalGuardedCents: params.capitalGuardedCents,
    proposerId: params.proposerId,
    proposedAt: new Date().toISOString(),
    status: "proposed",
  };
}

/**
 * Approves and cryptographically freezes a proposed policy.
 * Enforces strict separation of duties (proposer != checker).
 */
export function approvePolicy(params: ApprovePolicyParams): CognitivePolicyProposal {
  const { proposal, checkerId, tenantId } = params;

  if (!tenantId || tenantId !== proposal.tenantId) {
    throw new Error("Tenant mismatch: proposal does not belong to the requested tenant");
  }
  if (!checkerId || checkerId.trim() === "") {
    throw new Error("Checker identity invariant violation: checkerId is required");
  }
  if (checkerId === proposal.proposerId) {
    throw new Error(
      "SOX-404 dual-signature violation: checker identity cannot be identical to proposer identity"
    );
  }
  if (proposal.status !== "proposed") {
    throw new Error(`Cannot approve policy in status: ${proposal.status}`);
  }

  const approvedAt = new Date().toISOString();

  // Compute immutable SHA-256 certificate
  const certDigest = createHash("sha256")
    .update(
      JSON.stringify({
        tenantId,
        proposalId: proposal.proposalId,
        ruleHash: proposal.ruleHash,
        proposerId: proposal.proposerId,
        checkerId,
        approvedAt,
      })
    )
    .digest("hex");

  return {
    ...proposal,
    checkerId,
    approvedAt,
    status: "active",
    immutableCertificateHash: `0x${certDigest}`,
  };
}

/**
 * Rejects a proposed policy.
 */
export function rejectPolicy(params: RejectPolicyParams): CognitivePolicyProposal {
  const { proposal, checkerId, tenantId, rejectionReason } = params;

  if (!tenantId || tenantId !== proposal.tenantId) {
    throw new Error("Tenant mismatch: proposal does not belong to the requested tenant");
  }
  if (!checkerId || checkerId.trim() === "") {
    throw new Error("Checker identity invariant violation: checkerId is required");
  }
  if (proposal.status !== "proposed") {
    throw new Error(`Cannot reject policy in status: ${proposal.status}`);
  }

  return {
    ...proposal,
    checkerId,
    rejectionReason,
    status: "rejected",
  };
}

/**
 * Applies active cognitive policies onto base reconciliation parameters.
 */
export function applyActiveCognitivePolicies(params: {
  tenantId: string;
  baseToleranceCents: bigint;
  baseWindowSeconds: number;
  policies: CognitivePolicyProposal[];
}): PolicyApplicationResult {
  const { tenantId, baseToleranceCents, baseWindowSeconds, policies } = params;

  let effectiveToleranceCents = baseToleranceCents;
  let effectiveWindowSeconds = baseWindowSeconds;
  const appliedPolicyIds: string[] = [];

  for (const policy of policies) {
    if (policy.tenantId !== tenantId) {
      continue; // Skip foreign tenant policy
    }
    if (policy.status !== "active") {
      continue;
    }

    appliedPolicyIds.push(policy.proposalId);

    // Apply bounded tolerance modifications
    if (policy.action === "HEAL_FLOAT_TIMING") {
      const windowMultiplier = Number(policy.ruleConfig["windowMultiplier"] || 2);
      // Hard upper bound: cannot exceed 7 days (604800s)
      effectiveWindowSeconds = Math.min(effectiveWindowSeconds * windowMultiplier, 604800);
    } else if (policy.action === "HEAL_ROUNDING_PRECISION") {
      const deltaTolerance = BigInt(Number(policy.ruleConfig["deltaToleranceCents"] || 5));
      // Hard upper bound: cannot exceed 50 cents variance
      effectiveToleranceCents =
        effectiveToleranceCents + (deltaTolerance > 50n ? 50n : deltaTolerance);
    }
  }

  const auditHash = createHash("sha256")
    .update(
      JSON.stringify({
        tenantId,
        baseToleranceCents: baseToleranceCents.toString(),
        baseWindowSeconds,
        effectiveToleranceCents: effectiveToleranceCents.toString(),
        effectiveWindowSeconds,
        appliedPolicyIds,
      })
    )
    .digest("hex");

  return {
    effectiveToleranceCents,
    effectiveWindowSeconds,
    appliedPolicyIds,
    auditHash: `0x${auditHash}`,
  };
}
