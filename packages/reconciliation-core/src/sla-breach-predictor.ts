/**
 * Contractual SLA Breach Predictor
 *
 * Predicts and flags settlement clearing delay risks against processor SLAs
 * before financial penalties or regulatory breaches trigger.
 *
 * Deterministic integer millisecond arithmetic, strict tenant isolation.
 */

export interface SlaPolicy {
  rail: string;
  targetClearanceHours: number;
  maxAllowableHours: number;
  penaltyPerDayCents: number;
}

export interface MonitoredSettlement {
  transactionId: string;
  tenantId: string;
  rail: string;
  amountCents: number;
  initiatedAtMs: number;
  status: "pending_clearing" | "cleared" | "delayed";
}

export interface SlaAssessment {
  transactionId: string;
  tenantId: string;
  rail: string;
  elapsedHours: number;
  slaLimitHours: number;
  status: "HEALTHY" | "WARN_APPROACHING_SLA" | "CRITICAL_SLA_BREACH_IMMINENT" | "BREACHED";
  hoursUntilBreach: number;
  projectedPenaltyCents: number;
  actionRequired: boolean;
}

export const DEFAULT_SLA_POLICIES: Record<string, SlaPolicy> = {
  STRIPE: {
    rail: "STRIPE",
    targetClearanceHours: 48, // T+2
    maxAllowableHours: 72, // T+3 hard SLA
    penaltyPerDayCents: 2500, // $25/day SLA penalty
  },
  FEDACH: {
    rail: "FEDACH",
    targetClearanceHours: 24, // T+1
    maxAllowableHours: 48,
    penaltyPerDayCents: 5000, // $50/day
  },
  FEDNOW: {
    rail: "FEDNOW",
    targetClearanceHours: 0.1, // Sub-hour
    maxAllowableHours: 1, // 1 hour hard SLA
    penaltyPerDayCents: 10000, // $100/day
  },
};

export function assessSlaRisk(
  tenantId: string,
  settlement: MonitoredSettlement,
  policy: SlaPolicy,
  currentTimeMs: number = Date.now()
): SlaAssessment {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant context invariant violation: tenantId is required");
  }
  if (settlement.tenantId !== tenantId) {
    throw new Error("Cross-tenant access violation: tenantId mismatch");
  }

  const elapsedMs = Math.max(0, currentTimeMs - settlement.initiatedAtMs);
  const elapsedHours = elapsedMs / (3600 * 1000);
  const hoursUntilBreach = Number((policy.maxAllowableHours - elapsedHours).toFixed(2));

  let status: SlaAssessment["status"] = "HEALTHY";
  let projectedPenaltyCents = 0;
  let actionRequired = false;

  if (elapsedHours > policy.maxAllowableHours) {
    status = "BREACHED";
    actionRequired = true;
    const daysOverdue = Math.ceil((elapsedHours - policy.maxAllowableHours) / 24);
    projectedPenaltyCents = daysOverdue * policy.penaltyPerDayCents;
  } else if (elapsedHours >= policy.targetClearanceHours) {
    status = "CRITICAL_SLA_BREACH_IMMINENT";
    actionRequired = true;
  } else if (elapsedHours >= policy.targetClearanceHours * 0.75) {
    status = "WARN_APPROACHING_SLA";
    actionRequired = false;
  }

  return {
    transactionId: settlement.transactionId,
    tenantId,
    rail: settlement.rail,
    elapsedHours: Number(elapsedHours.toFixed(2)),
    slaLimitHours: policy.maxAllowableHours,
    status,
    hoursUntilBreach,
    projectedPenaltyCents,
    actionRequired,
  };
}
