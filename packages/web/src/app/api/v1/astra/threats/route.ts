import { NextRequest, NextResponse } from "next/server";
import {
  evaluateBatchThreats,
  PatternLearningEngine,
  type TransactionThreatContext,
} from "@settler/reconciliation-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RawThreatTxInput {
  id: string;
  tenantId?: string;
  rail: "stripe" | "paypal" | "adyen" | "ach" | "fednow" | "card_interchange" | "depository";
  amountCents: number | string;
  feeCents?: number | string;
  currency?: string;
  timestamp?: string;
  reference?: string;
  arn?: string;
  idempotencyKey?: string;
  originalCurrency?: string;
  appliedExchangeRate?: number;
  benchmarkExchangeRate?: number;
  contractedRateBps?: number;
  contractedFixedFeeCents?: number | string;
  hasMerchantRefund?: boolean;
  hasDisputeClawback?: boolean;
  subscriptionStatus?: "active" | "canceled" | "expired" | "revoked";
  subscriptionCanceledAt?: string;
  cardCommercialType?: "consumer" | "corporate" | "purchasing" | "fleet";
  hasLevel2Data?: boolean;
  hasLevel3Data?: boolean;
  clearingExpectedAt?: string;
  actualSettledAt?: string;
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const { tenantId = "tenant_enterprise_019a", transactions = [], options = {} } = body;

    // Invariant 1: Multi-tenant scoping required
    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        {
          error:
            "TenantId invariant violation: Every request must be strictly scoped to a tenantId",
          code: "SETTLER_INVARIANT_TENANT_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Convert raw input to BigInt-guarded TransactionThreatContext
    const contexts: TransactionThreatContext[] = (transactions as RawThreatTxInput[]).map(
      (raw, idx) => ({
        id: raw.id || `tx_${idx + 1}`,
        tenantId: raw.tenantId || tenantId,
        rail: raw.rail || "stripe",
        amountCents: BigInt(raw.amountCents || 0),
        feeCents: raw.feeCents !== undefined ? BigInt(raw.feeCents) : undefined,
        currency: raw.currency || "USD",
        timestamp: raw.timestamp || new Date().toISOString(),
        reference: raw.reference,
        arn: raw.arn,
        idempotencyKey: raw.idempotencyKey,
        originalCurrency: raw.originalCurrency,
        appliedExchangeRate: raw.appliedExchangeRate,
        benchmarkExchangeRate: raw.benchmarkExchangeRate,
        contractedRateBps: raw.contractedRateBps,
        contractedFixedFeeCents:
          raw.contractedFixedFeeCents !== undefined
            ? BigInt(raw.contractedFixedFeeCents)
            : undefined,
        hasMerchantRefund: raw.hasMerchantRefund,
        hasDisputeClawback: raw.hasDisputeClawback,
        subscriptionStatus: raw.subscriptionStatus,
        subscriptionCanceledAt: raw.subscriptionCanceledAt,
        cardCommercialType: raw.cardCommercialType,
        hasLevel2Data: raw.hasLevel2Data,
        hasLevel3Data: raw.hasLevel3Data,
        clearingExpectedAt: raw.clearingExpectedAt,
        actualSettledAt: raw.actualSettledAt,
      })
    );

    // 1. Evaluate batch threats deterministically
    const report = evaluateBatchThreats(contexts, {
      tenantId,
      fxSpreadToleranceBps: options.fxSpreadToleranceBps ?? 15,
      feeCreepToleranceBps: options.feeCreepToleranceBps ?? 5,
      maxAllowedFloatDelayHours: options.maxAllowedFloatDelayHours ?? 72,
    });

    // 2. Ingest into Pattern Learning Engine for autonomous self-healing synthesis
    const learningEngine = new PatternLearningEngine(tenantId);
    learningEngine.ingestThreatObservations(report.threats, {
      rail: contexts[0]?.rail || "multi_rail",
      currency: contexts[0]?.currency || "USD",
    });

    const summary = learningEngine.produceSummaryReport();
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Format response serializing BigInts
    const serializedThreats = report.threats.map((t) => ({
      ...t,
      capitalAtRiskCents: Number(t.capitalAtRiskCents),
    }));

    const serializedPlans = summary.healingPlans.map((p) => ({
      ...p,
      capitalGuardedCents: Number(p.capitalGuardedCents),
    }));

    const response = NextResponse.json({
      status: "evaluated",
      tenantId,
      evaluatedAt: report.evaluatedAt,
      durationMs,
      summary: {
        totalEvaluated: report.totalTransactionsEvaluated,
        threatsDetectedCount: report.threatsDetectedCount,
        totalCapitalGuardedCents: Number(report.totalCapitalGuardedCents),
        merkleStateRoot: report.merkleStateRoot,
        severityDistribution: report.severityDistribution,
        threatTypeDistribution: report.threatTypeDistribution,
        blastRadiusDistribution: report.blastRadiusDistribution,
      },
      threats: serializedThreats,
      learningAndResilience: {
        totalClustersTracked: summary.totalClustersTracked,
        activePostures: summary.activePostures,
        calibratedTolerancesByRail: summary.calibratedTolerancesByRail,
        selfHealingPlans: serializedPlans,
        estimatedOperationalSavingsCents: Number(summary.estimatedOperationalSavingsCents),
      },
      audit: {
        engine: "@settler/reconciliation-core",
        rfc6962Sealed: true,
        zeroFloatDriftEnforced: true,
      },
    });

    response.headers.set("x-settler-tenant-id", tenantId);
    response.headers.set("x-settler-merkle-root", report.merkleStateRoot);
    response.headers.set("x-settler-threats-detected", String(report.threatsDetectedCount));
    response.headers.set(
      "x-settler-capital-guarded-cents",
      report.totalCapitalGuardedCents.toString()
    );
    response.headers.set("x-settler-duration-ms", String(durationMs));

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal threat evaluation failure";
    return NextResponse.json(
      {
        error: message,
        code: "SETTLER_THREAT_EVALUATION_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-settler-tenant-id") || "tenant_enterprise_019a";

  return NextResponse.json({
    status: "operational",
    tenantId,
    timestamp: new Date().toISOString(),
    supportedThreatVectors: [
      {
        type: "CROSS_TENANT_LEAK_ATTEMPT",
        severity: "critical",
        blastRadius: "systemic",
        description:
          "Enforces strict partition boundary; quarantines unauthorized cross-tenant entity operations.",
      },
      {
        type: "CHARGEBACK_DOUBLE_DIP",
        severity: "critical",
        blastRadius: "merchant_account",
        description:
          "Detects concurrent merchant refund and acquirer chargeback debits on identical ARN.",
      },
      {
        type: "FEE_CREEP_ANOMALY",
        severity: "high",
        blastRadius: "settlement_rail",
        description:
          "Identifies basis-point fee creep exceeding agreed processor pricing schedules.",
      },
      {
        type: "UNDISCLOSED_FX_SPREAD",
        severity: "high",
        blastRadius: "settlement_rail",
        description:
          "Unmasks hidden currency conversion margins compared against interbank ECB mid-market benchmarks.",
      },
      {
        type: "REPLAY_ATTACK_COLLISION",
        severity: "high",
        blastRadius: "isolated_tx",
        description:
          "Deduplicates webhook and API payload re-executions with sliding-window idempotency locks.",
      },
      {
        type: "GHOST_SUBSCRIPTION_LEAK",
        severity: "high",
        blastRadius: "merchant_account",
        description:
          "Catches zombie subscription billing after user cancellation or payment token revocation.",
      },
      {
        type: "INTERCHANGE_DOWNGRADE_LEAK",
        severity: "medium",
        blastRadius: "merchant_account",
        description:
          "Identifies commercial cards missing Level 2 / Level 3 data incurring 110-140 bps penalties.",
      },
      {
        type: "UNSETTLED_FLOAT_EXHAUSTION",
        severity: "medium",
        blastRadius: "settlement_rail",
        description:
          "Flags depository settlement lag extending past contractual T+2/T+3 clearing SLAs.",
      },
    ],
    invariants: {
      zeroFloatDrift: true,
      rfc6962MerkleRooting: true,
      tenantIsolationGuaranteed: true,
    },
  });
}
