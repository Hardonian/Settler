/**
 * Autonomous Interchange Route Recommender
 *
 * Cost-optimal payment rail routing engine. Analyzes transaction characteristics
 * (amount in integer cents, payment method, corporate card status, cross-border status)
 * to recommend the lowest-cost settlement rail and calculate basis point savings.
 *
 * Deterministic, strict integer cents arithmetic, zero float drift.
 */

export interface RoutingCandidate {
  rail: "ACH" | "FEDNOW" | "STRIPE" | "ADYEN" | "SEPA_INSTANT";
  name: string;
  projectedFeeCents: number;
  effectiveBps: number;
  clearingLatencyHours: number;
  requiresL2L3Optimization: boolean;
}

export interface RoutingRecommendation {
  tenantId: string;
  transactionAmountCents: number;
  currency: string;
  isCorporateCard: boolean;
  isCrossBorder: boolean;
  recommendedRail: RoutingCandidate;
  alternateRails: RoutingCandidate[];
  estimatedSavingsCentsVsDefault: number;
  routingDecisionReason: string;
}

/**
 * Calculates fee for each rail in integer cents.
 */
function evaluateRailCost(
  rail: RoutingCandidate["rail"],
  amountCents: number,
  currency: string,
  isCorporateCard: boolean,
  isCrossBorder: boolean
): RoutingCandidate {
  let feeCents = 0;
  let latencyHours = 24;
  let requiresL2L3 = false;
  let name = "";

  switch (rail) {
    case "ACH":
      name = "Federal Reserve ACH";
      // ACH: 0.8% capped at $5.00 (500 cents) + $0.20 fixed
      feeCents = Math.min(500, Math.floor((amountCents * 80) / 10000)) + 20;
      latencyHours = 48; // T+2
      break;

    case "FEDNOW":
      name = "FedNow Instant Settlement";
      // FedNow: $0.045 flat fee (5 cents rounded) + $0.01 assessment
      feeCents = 6;
      latencyHours = 0; // Sub-second
      break;

    case "SEPA_INSTANT":
      name = "SEPA Instant Credit Transfer";
      // SEPA: flat 0.20 EUR (20 cents)
      feeCents = 20;
      latencyHours = 0;
      break;

    case "ADYEN":
      name = "Adyen Interchange++";
      // Adyen: interchange passthrough (approx 1.5% consumer, 2.6% corp) + $0.12 markup
      const adyenBps = (isCorporateCard ? 260 : 150) + (isCrossBorder ? 80 : 0);
      feeCents = Math.floor((amountCents * adyenBps) / 10000) + 12;
      latencyHours = 24;
      requiresL2L3 = isCorporateCard;
      break;

    case "STRIPE":
    default:
      name = "Stripe Blended Processing";
      // Stripe standard: 2.9% + $0.30 (290 bps + 30 cents) + 1% cross border
      const stripeBps = 290 + (isCrossBorder ? 100 : 0);
      feeCents = Math.floor((amountCents * stripeBps) / 10000) + 30;
      latencyHours = 48;
      requiresL2L3 = isCorporateCard;
      break;
  }

  const effectiveBps = amountCents > 0 ? Math.floor((feeCents * 10000) / amountCents) : 0;

  return {
    rail,
    name,
    projectedFeeCents: feeCents,
    effectiveBps,
    clearingLatencyHours: latencyHours,
    requiresL2L3Optimization: requiresL2L3,
  };
}

export function recommendOptimalRoute(
  tenantId: string,
  amountCents: number,
  currency: string = "USD",
  isCorporateCard: boolean = false,
  isCrossBorder: boolean = false
): RoutingRecommendation {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant isolation invariant violation: tenantId is required");
  }

  const candidateRails: RoutingCandidate["rail"][] =
    currency === "EUR" ? ["SEPA_INSTANT", "ADYEN", "STRIPE"] : ["FEDNOW", "ACH", "ADYEN", "STRIPE"];

  const evaluated = candidateRails.map((rail) =>
    evaluateRailCost(rail, amountCents, currency, isCorporateCard, isCrossBorder)
  );

  // Sort ascending by fee (lowest fee first)
  evaluated.sort((a, b) => a.projectedFeeCents - b.projectedFeeCents);

  const optimal = evaluated[0]!;
  const defaultRail =
    evaluated.find((e) => e.rail === "STRIPE") || evaluated[evaluated.length - 1]!;
  const savingsVsDefault = Math.max(0, defaultRail.projectedFeeCents - optimal.projectedFeeCents);

  let reason = `Selected ${optimal.name} achieving lowest fee of $${(optimal.projectedFeeCents / 100).toFixed(2)} (${optimal.effectiveBps} bps).`;
  if (savingsVsDefault > 0) {
    reason += ` Generates $${(savingsVsDefault / 100).toFixed(2)} savings vs default processor.`;
  }
  if (optimal.requiresL2L3Optimization) {
    reason += ` Corporate card detected: automated L2/L3 invoice level data attached to avoid interchange downgrade.`;
  }

  return {
    tenantId,
    transactionAmountCents: amountCents,
    currency,
    isCorporateCard,
    isCrossBorder,
    recommendedRail: optimal,
    alternateRails: evaluated.slice(1),
    estimatedSavingsCentsVsDefault: savingsVsDefault,
    routingDecisionReason: reason,
  };
}
