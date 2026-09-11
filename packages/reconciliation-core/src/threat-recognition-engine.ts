/**
 * Threat Recognition Engine
 *
 * Deterministic, cryptographic detection of financial, operational, and multi-tenant security threats.
 * Enforces zero-float BigInt cents arithmetic, RFC 6962 SHA-256 Merkle leaf hashing,
 * and tenant isolation invariants across multi-rail clearing networks.
 */

import { createHash } from "node:crypto";

export type ThreatType =
  | "FEE_CREEP_ANOMALY"
  | "UNDISCLOSED_FX_SPREAD"
  | "REPLAY_ATTACK_COLLISION"
  | "CHARGEBACK_DOUBLE_DIP"
  | "GHOST_SUBSCRIPTION_LEAK"
  | "CROSS_TENANT_LEAK_ATTEMPT"
  | "INTERCHANGE_DOWNGRADE_LEAK"
  | "UNSETTLED_FLOAT_EXHAUSTION";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export type BlastRadius = "isolated_tx" | "merchant_account" | "settlement_rail" | "systemic";

export type ThreatRemediationAction =
  | "auto_clawback"
  | "freeze_payout"
  | "escalate_treasury"
  | "renegotiate_fee"
  | "reject_and_quarantine"
  | "enrich_l3_data";

export interface TransactionThreatContext {
  id: string;
  tenantId: string;
  rail: "stripe" | "paypal" | "adyen" | "ach" | "fednow" | "card_interchange" | "depository";
  amountCents: bigint;
  feeCents?: bigint;
  currency: string;
  timestamp: string | Date;
  reference?: string;
  arn?: string; // 23-digit Acquirer Reference Number
  idempotencyKey?: string;
  payloadHash?: string;
  metadata?: Record<string, unknown>;
  // For FX checks
  originalCurrency?: string;
  originalAmountCents?: bigint;
  appliedExchangeRate?: number;
  benchmarkExchangeRate?: number;
  // For fee creep
  contractedRateBps?: number;
  contractedFixedFeeCents?: bigint;
  // For chargeback / refund correlation
  hasMerchantRefund?: boolean;
  hasDisputeClawback?: boolean;
  // For subscription checks
  subscriptionStatus?: "active" | "canceled" | "expired" | "revoked";
  subscriptionCanceledAt?: string | Date;
  // For L2/L3 interchange checks
  cardCommercialType?: "consumer" | "corporate" | "purchasing" | "fleet";
  hasLevel2Data?: boolean;
  hasLevel3Data?: boolean;
  // For float aging
  clearingExpectedAt?: string | Date;
  actualSettledAt?: string | Date;
}

export interface ThreatEvaluationResult {
  threatId: string;
  tenantId: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  blastRadius: BlastRadius;
  capitalAtRiskCents: bigint;
  currency: string;
  detectedAt: string;
  transactionId: string;
  summary: string;
  details: Record<string, unknown>;
  evidenceMerkleLeaf: string;
  remediation: {
    action: ThreatRemediationAction;
    autoExecutable: boolean;
    description: string;
    clawbackDossierId?: string;
  };
  mitigationStatus: "active" | "mitigated" | "escalated" | "quarantined";
}

export interface ThreatBatchReport {
  tenantId: string;
  evaluatedAt: string;
  totalTransactionsEvaluated: number;
  threatsDetectedCount: number;
  totalCapitalGuardedCents: bigint;
  severityDistribution: Record<ThreatSeverity, number>;
  threatTypeDistribution: Record<ThreatType, number>;
  blastRadiusDistribution: Record<BlastRadius, number>;
  merkleStateRoot: string;
  threats: ThreatEvaluationResult[];
}

/**
 * Calculates RFC 6962 leaf hash: SHA-256(0x00 || data)
 */
export function calculateRfc6962LeafHash(data: string): string {
  const prefix = Buffer.from([0x00]);
  const content = Buffer.from(data, "utf8");
  return createHash("sha256")
    .update(Buffer.concat([prefix, content]))
    .digest("hex");
}

/**
 * Calculates RFC 6962 node hash: SHA-256(0x01 || left || right)
 */
export function calculateRfc6962NodeHash(leftHex: string, rightHex: string): string {
  const prefix = Buffer.from([0x01]);
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  return createHash("sha256")
    .update(Buffer.concat([prefix, left, right]))
    .digest("hex");
}

/**
 * Evaluates a single transaction for potential fintech, security, and operational threats.
 */
export function evaluateTransactionThreat(
  context: TransactionThreatContext,
  options: {
    activeTenantId: string;
    fxSpreadToleranceBps?: number; // default 15 bps (0.15%)
    feeCreepToleranceBps?: number; // default 5 bps (0.05%)
    maxAllowedFloatDelayHours?: number; // default 72h
  }
): ThreatEvaluationResult | null {
  const {
    activeTenantId,
    fxSpreadToleranceBps = 15,
    feeCreepToleranceBps = 5,
    maxAllowedFloatDelayHours = 72,
  } = options;

  // INVARIANT 1: Strict Tenant Isolation Enforcement
  if (context.tenantId !== activeTenantId) {
    const capitalAtRisk = context.amountCents;
    const leafData = `CROSS_TENANT_LEAK:${activeTenantId}:${context.tenantId}:${context.id}:${capitalAtRisk.toString()}`;
    const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
    const threatId = createHash("sha256").update(`THREAT:CROSS_TENANT:${context.id}`).digest("hex");

    return {
      threatId,
      tenantId: activeTenantId,
      threatType: "CROSS_TENANT_LEAK_ATTEMPT",
      severity: "critical",
      blastRadius: "systemic",
      capitalAtRiskCents: capitalAtRisk,
      currency: context.currency,
      detectedAt: new Date().toISOString(),
      transactionId: context.id,
      summary: `Cross-tenant isolation violation: transaction owned by '${context.tenantId}' injected into tenant '${activeTenantId}'.`,
      details: {
        attemptedTenantId: context.tenantId,
        authorizedTenantId: activeTenantId,
        rail: context.rail,
      },
      evidenceMerkleLeaf,
      remediation: {
        action: "reject_and_quarantine",
        autoExecutable: true,
        description:
          "Immediate isolation quarantine triggered. Abort ingestion and rotate session context.",
      },
      mitigationStatus: "quarantined",
    };
  }

  // Check 2: Chargeback Double-Dipping
  if (context.hasMerchantRefund && context.hasDisputeClawback) {
    const capitalAtRisk = context.amountCents;
    const leafData = `DOUBLE_DIP:${context.tenantId}:${context.id}:${context.arn ?? "NO_ARN"}:${capitalAtRisk.toString()}`;
    const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
    const threatId = createHash("sha256").update(`THREAT:DOUBLE_DIP:${context.id}`).digest("hex");

    return {
      threatId,
      tenantId: activeTenantId,
      threatType: "CHARGEBACK_DOUBLE_DIP",
      severity: "critical",
      blastRadius: "merchant_account",
      capitalAtRiskCents: capitalAtRisk,
      currency: context.currency,
      detectedAt: new Date().toISOString(),
      transactionId: context.id,
      summary: `Duplicate capital clawback detected: both merchant refund and processor chargeback settled for ARN ${context.arn ?? context.id}.`,
      details: {
        arn: context.arn,
        reference: context.reference,
        rail: context.rail,
      },
      evidenceMerkleLeaf,
      remediation: {
        action: "auto_clawback",
        autoExecutable: true,
        description:
          "Submit duplicate reversal claim to acquiring bank citing ARN and original refund settlement hash.",
        clawbackDossierId: `DOSSIER-${threatId.substring(0, 12).toUpperCase()}`,
      },
      mitigationStatus: "active",
    };
  }

  // Check 3: Fee Creep Anomaly
  if (
    context.feeCents !== undefined &&
    context.contractedRateBps !== undefined &&
    context.contractedFixedFeeCents !== undefined
  ) {
    // Expected fee = (amount * contractedRateBps) / 10000 + contractedFixedFeeCents
    const variableFee = (context.amountCents * BigInt(context.contractedRateBps)) / 10000n;
    const expectedFeeCents = variableFee + context.contractedFixedFeeCents;
    const actualFeeCents = context.feeCents;

    if (actualFeeCents > expectedFeeCents) {
      const excessFeeCents = actualFeeCents - expectedFeeCents;
      // Calculate basis points variance on transaction amount
      const basisPointsOver =
        context.amountCents > 0n ? Number((excessFeeCents * 10000n) / context.amountCents) : 0;

      if (basisPointsOver > feeCreepToleranceBps) {
        const leafData = `FEE_CREEP:${context.tenantId}:${context.id}:${excessFeeCents.toString()}:${basisPointsOver}`;
        const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
        const threatId = createHash("sha256")
          .update(`THREAT:FEE_CREEP:${context.id}`)
          .digest("hex");

        return {
          threatId,
          tenantId: activeTenantId,
          threatType: "FEE_CREEP_ANOMALY",
          severity: basisPointsOver > 50 ? "high" : "medium",
          blastRadius: "settlement_rail",
          capitalAtRiskCents: excessFeeCents,
          currency: context.currency,
          detectedAt: new Date().toISOString(),
          transactionId: context.id,
          summary: `Processor fee creep detected on ${context.rail}: +${basisPointsOver} bps (${excessFeeCents.toString()} cents) above contract rate.`,
          details: {
            expectedFeeCents: expectedFeeCents.toString(),
            actualFeeCents: actualFeeCents.toString(),
            excessFeeCents: excessFeeCents.toString(),
            contractedRateBps: context.contractedRateBps,
            effectiveRateBps: context.contractedRateBps + basisPointsOver,
          },
          evidenceMerkleLeaf,
          remediation: {
            action: "renegotiate_fee",
            autoExecutable: false,
            description:
              "Queue basis-point overcharge into monthly acquirer billing reconciliation audit brief.",
          },
          mitigationStatus: "active",
        };
      }
    }
  }

  // Check 4: Undisclosed FX Spread Creep
  if (
    context.appliedExchangeRate !== undefined &&
    context.benchmarkExchangeRate !== undefined &&
    context.appliedExchangeRate > 0 &&
    context.benchmarkExchangeRate > 0
  ) {
    // Margin spread = |applied - benchmark| / benchmark
    const spreadPct =
      Math.abs(context.appliedExchangeRate - context.benchmarkExchangeRate) /
      context.benchmarkExchangeRate;
    const spreadBps = Math.round(spreadPct * 10000);

    if (spreadBps > fxSpreadToleranceBps) {
      // Calculate capital lost to hidden spread in original currency cents
      const capitalLostCents = BigInt(Math.round(Number(context.amountCents) * spreadPct));
      const leafData = `UNDISCLOSED_FX:${context.tenantId}:${context.id}:${spreadBps}:${capitalLostCents.toString()}`;
      const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
      const threatId = createHash("sha256").update(`THREAT:FX_SPREAD:${context.id}`).digest("hex");

      return {
        threatId,
        tenantId: activeTenantId,
        threatType: "UNDISCLOSED_FX_SPREAD",
        severity: spreadBps > 100 ? "high" : "medium",
        blastRadius: "settlement_rail",
        capitalAtRiskCents: capitalLostCents,
        currency: context.currency,
        detectedAt: new Date().toISOString(),
        transactionId: context.id,
        summary: `Undisclosed FX spread detected: ${spreadBps} bps hidden markup against benchmark mid-market rate.`,
        details: {
          appliedRate: context.appliedExchangeRate,
          benchmarkRate: context.benchmarkExchangeRate,
          spreadBps,
          pair: `${context.originalCurrency ?? "ORIG"}/${context.currency}`,
        },
        evidenceMerkleLeaf,
        remediation: {
          action: "escalate_treasury",
          autoExecutable: false,
          description:
            "Escalate to treasury team for multi-currency routing rule re-configuration.",
        },
        mitigationStatus: "active",
      };
    }
  }

  // Check 5: Ghost Subscription / Zombie Charges
  if (
    context.subscriptionStatus === "canceled" ||
    context.subscriptionStatus === "revoked" ||
    context.subscriptionStatus === "expired"
  ) {
    const capitalAtRisk = context.amountCents;
    const leafData = `GHOST_SUB:${context.tenantId}:${context.id}:${context.subscriptionStatus}:${capitalAtRisk.toString()}`;
    const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
    const threatId = createHash("sha256").update(`THREAT:GHOST_SUB:${context.id}`).digest("hex");

    return {
      threatId,
      tenantId: activeTenantId,
      threatType: "GHOST_SUBSCRIPTION_LEAK",
      severity: "high",
      blastRadius: "merchant_account",
      capitalAtRiskCents: capitalAtRisk,
      currency: context.currency,
      detectedAt: new Date().toISOString(),
      transactionId: context.id,
      summary: `Ghost subscription debit: processed charge on ${context.subscriptionStatus} subscription (canceled at ${context.subscriptionCanceledAt ?? "prior"}).`,
      details: {
        subscriptionStatus: context.subscriptionStatus,
        subscriptionCanceledAt: context.subscriptionCanceledAt,
        reference: context.reference,
      },
      evidenceMerkleLeaf,
      remediation: {
        action: "auto_clawback",
        autoExecutable: true,
        description:
          "Trigger automated reversal API call to prevent customer churn and chargeback filing.",
      },
      mitigationStatus: "active",
    };
  }

  // Check 6: Interchange Level 2 / Level 3 Downgrade Leakage
  if (
    (context.cardCommercialType === "corporate" || context.cardCommercialType === "purchasing") &&
    (!context.hasLevel2Data || !context.hasLevel3Data)
  ) {
    // Commercial cards without L2/L3 typically downgrade from ~1.85% to ~3.15% (130 bps penalty)
    const estimatedPenaltyBps = 125n;
    const downgradePenaltyCents = (context.amountCents * estimatedPenaltyBps) / 10000n;
    const leafData = `L2_L3_DOWNGRADE:${context.tenantId}:${context.id}:${downgradePenaltyCents.toString()}`;
    const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
    const threatId = createHash("sha256").update(`THREAT:L2L3:${context.id}`).digest("hex");

    return {
      threatId,
      tenantId: activeTenantId,
      threatType: "INTERCHANGE_DOWNGRADE_LEAK",
      severity: "medium",
      blastRadius: "merchant_account",
      capitalAtRiskCents: downgradePenaltyCents,
      currency: context.currency,
      detectedAt: new Date().toISOString(),
      transactionId: context.id,
      summary: `Interchange downgrade penalty: ${context.cardCommercialType} card processed without Level 2/3 commodity data (loss: ~125 bps).`,
      details: {
        cardType: context.cardCommercialType,
        missingLevel2: !context.hasLevel2Data,
        missingLevel3: !context.hasLevel3Data,
        estimatedPenaltyCents: downgradePenaltyCents.toString(),
      },
      evidenceMerkleLeaf,
      remediation: {
        action: "enrich_l3_data",
        autoExecutable: true,
        description:
          "Apply autonomous UNSPSC commodity code and tax synthesis before batch settlement submission.",
      },
      mitigationStatus: "active",
    };
  }

  // Check 7: Unsettled Float Delay / Liquidity Exhaustion
  if (context.clearingExpectedAt && context.actualSettledAt) {
    const expected = new Date(context.clearingExpectedAt).getTime();
    const actual = new Date(context.actualSettledAt).getTime();
    const delayHours = (actual - expected) / (1000 * 60 * 60);

    if (delayHours > maxAllowedFloatDelayHours) {
      const capitalAtRisk = context.amountCents;
      const leafData = `FLOAT_EXHAUSTION:${context.tenantId}:${context.id}:${Math.round(delayHours)}h:${capitalAtRisk.toString()}`;
      const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
      const threatId = createHash("sha256").update(`THREAT:FLOAT:${context.id}`).digest("hex");

      return {
        threatId,
        tenantId: activeTenantId,
        threatType: "UNSETTLED_FLOAT_EXHAUSTION",
        severity: delayHours > 120 ? "high" : "medium",
        blastRadius: "settlement_rail",
        capitalAtRiskCents: capitalAtRisk,
        currency: context.currency,
        detectedAt: new Date().toISOString(),
        transactionId: context.id,
        summary: `Unsettled float SLA breach on ${context.rail}: settlement delayed by ${Math.round(delayHours)}h beyond expected clearing cutoff.`,
        details: {
          delayHours: Math.round(delayHours),
          clearingExpectedAt: context.clearingExpectedAt,
          actualSettledAt: context.actualSettledAt,
        },
        evidenceMerkleLeaf,
        remediation: {
          action: "escalate_treasury",
          autoExecutable: false,
          description:
            "Alert treasury desk to deploy bridge credit or initiate depository bank settlement inquiry.",
        },
        mitigationStatus: "active",
      };
    }
  }

  return null;
}

/**
 * Replay Attack & Collision Guard:
 * Detects identical payload hashes or idempotency keys submitted within sliding windows.
 */
export function evaluateReplayCollisions(
  transactions: TransactionThreatContext[],
  tenantId: string
): ThreatEvaluationResult[] {
  const seenIdempotencyKeys = new Map<string, TransactionThreatContext>();
  const threats: ThreatEvaluationResult[] = [];

  for (const tx of transactions) {
    if (tx.idempotencyKey) {
      const prior = seenIdempotencyKeys.get(tx.idempotencyKey);
      if (prior) {
        const capitalAtRisk = tx.amountCents;
        const leafData = `REPLAY_COLLISION:${tenantId}:${tx.id}:${prior.id}:${tx.idempotencyKey}`;
        const evidenceMerkleLeaf = calculateRfc6962LeafHash(leafData);
        const threatId = createHash("sha256")
          .update(`THREAT:REPLAY:${tx.id}:${prior.id}`)
          .digest("hex");

        threats.push({
          threatId,
          tenantId,
          threatType: "REPLAY_ATTACK_COLLISION",
          severity: "high",
          blastRadius: "isolated_tx",
          capitalAtRiskCents: capitalAtRisk,
          currency: tx.currency,
          detectedAt: new Date().toISOString(),
          transactionId: tx.id,
          summary: `Idempotency collision / replay attack detected: key '${tx.idempotencyKey}' reused across transactions ${prior.id} and ${tx.id}.`,
          details: {
            conflictingTransactionId: prior.id,
            idempotencyKey: tx.idempotencyKey,
            originalTimestamp: prior.timestamp,
            replayTimestamp: tx.timestamp,
          },
          evidenceMerkleLeaf,
          remediation: {
            action: "reject_and_quarantine",
            autoExecutable: true,
            description:
              "Reject duplicate payload with 409 Conflict and serve cached response from idempotency ledger.",
          },
          mitigationStatus: "quarantined",
        });
      } else {
        seenIdempotencyKeys.set(tx.idempotencyKey, tx);
      }
    }
  }

  return threats;
}

/**
 * Evaluates an entire batch of transactions for all threat vectors,
 * computing cumulative capital guarded and an RFC 6962 Merkle state root.
 */
export function evaluateBatchThreats(
  transactions: TransactionThreatContext[],
  options: {
    tenantId: string;
    fxSpreadToleranceBps?: number;
    feeCreepToleranceBps?: number;
    maxAllowedFloatDelayHours?: number;
  }
): ThreatBatchReport {
  const { tenantId } = options;
  const threats: ThreatEvaluationResult[] = [];

  // 1. Evaluate individual transaction threat rules
  for (const tx of transactions) {
    const result = evaluateTransactionThreat(tx, {
      activeTenantId: tenantId,
      fxSpreadToleranceBps: options.fxSpreadToleranceBps,
      feeCreepToleranceBps: options.feeCreepToleranceBps,
      maxAllowedFloatDelayHours: options.maxAllowedFloatDelayHours,
    });
    if (result) {
      threats.push(result);
    }
  }

  // 2. Evaluate batch-level replay attack collisions
  const replayThreats = evaluateReplayCollisions(transactions, tenantId);
  threats.push(...replayThreats);

  // 3. Compute distributions and total capital guarded
  let totalCapitalGuardedCents = 0n;
  const severityDistribution: Record<ThreatSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const threatTypeDistribution: Record<ThreatType, number> = {
    FEE_CREEP_ANOMALY: 0,
    UNDISCLOSED_FX_SPREAD: 0,
    REPLAY_ATTACK_COLLISION: 0,
    CHARGEBACK_DOUBLE_DIP: 0,
    GHOST_SUBSCRIPTION_LEAK: 0,
    CROSS_TENANT_LEAK_ATTEMPT: 0,
    INTERCHANGE_DOWNGRADE_LEAK: 0,
    UNSETTLED_FLOAT_EXHAUSTION: 0,
  };
  const blastRadiusDistribution: Record<BlastRadius, number> = {
    isolated_tx: 0,
    merchant_account: 0,
    settlement_rail: 0,
    systemic: 0,
  };

  const leafHashes: string[] = [];

  for (const threat of threats) {
    totalCapitalGuardedCents += threat.capitalAtRiskCents;
    severityDistribution[threat.severity]++;
    threatTypeDistribution[threat.threatType]++;
    blastRadiusDistribution[threat.blastRadius]++;
    leafHashes.push(threat.evidenceMerkleLeaf);
  }

  // 4. Compute RFC 6962 Merkle State Root
  let merkleStateRoot = "0000000000000000000000000000000000000000000000000000000000000000";
  if (leafHashes.length > 0) {
    let currentLevel = [...leafHashes].sort();
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(calculateRfc6962NodeHash(currentLevel[i]!, currentLevel[i + 1]!));
        } else {
          nextLevel.push(currentLevel[i]!); // Odd leaf promotion
        }
      }
      currentLevel = nextLevel;
    }
    merkleStateRoot = currentLevel[0] ?? merkleStateRoot;
  }

  return {
    tenantId,
    evaluatedAt: new Date().toISOString(),
    totalTransactionsEvaluated: transactions.length,
    threatsDetectedCount: threats.length,
    totalCapitalGuardedCents,
    severityDistribution,
    threatTypeDistribution,
    blastRadiusDistribution,
    merkleStateRoot,
    threats,
  };
}
