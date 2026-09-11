/**
 * Autonomous Currency Hedging Drift Warning
 *
 * Monitors open multi-currency settlement balances against tenant risk tolerance
 * thresholds to detect unhedged foreign exchange drift before margin erosion.
 *
 * Strict integer cents arithmetic, zero float drift, RFC 6962 hash linked.
 */

import { createHash } from "node:crypto";

export interface CurrencyBalancePosition {
  currency: string;
  balanceMinorUnits: number; // e.g. 5000000 = 50,000.00 EUR
  rateToBaseBps: number; // e.g. 10850 = 1.0850 USD per EUR (in basis points)
  unhedgedRatioBps: number; // 0..10000 (10000 = 100% unhedged)
}

export interface FxHedgingPolicy {
  baseCurrency: string;
  maxUnhedgedExposureCents: number; // e.g. $25,000.00 = 2500000 cents
  maxDriftBps: number; // e.g. 100 bps (1.00%)
}

export interface FxExposureReport {
  tenantId: string;
  baseCurrency: string;
  totalUnhedgedExposureBaseCents: number;
  maxAllowableExposureCents: number;
  status: "EXPOSURE_SAFE" | "HEDGE_RECOMMENDED" | "CRITICAL_UNHEDGED_DRIFT";
  breachingCurrencies: string[];
  recommendedHedgeOrders: Array<{
    sellCurrency: string;
    buyCurrency: string;
    amountToHedgeMinorUnits: number;
    recommendedOrderType: "SPOT_CONVERSION" | "FORWARD_LOCK";
  }>;
  reportMerkleRoot: string;
}

export function evaluateFxHedgingDrift(
  tenantId: string,
  positions: CurrencyBalancePosition[],
  policy: FxHedgingPolicy
): FxExposureReport {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant context invariant violation: tenantId is required");
  }

  let totalUnhedgedBaseCents = 0;
  const breachingCurrencies: string[] = [];
  const recommendedHedgeOrders: FxExposureReport["recommendedHedgeOrders"] = [];

  for (const pos of positions) {
    if (pos.currency === policy.baseCurrency) continue;

    // Convert to base currency cents: (balance * rateToBaseBps) / 10000
    const baseValueCents = Math.floor((pos.balanceMinorUnits * pos.rateToBaseBps) / 10000);
    // Unhedged portion
    const unhedgedBaseCents = Math.floor((baseValueCents * pos.unhedgedRatioBps) / 10000);
    totalUnhedgedBaseCents += unhedgedBaseCents;

    // If individual currency exceeds 50% of total policy limit
    if (unhedgedBaseCents > policy.maxUnhedgedExposureCents / 2) {
      breachingCurrencies.push(pos.currency);
      // Recommend hedging excess down to 25% of limit
      const targetCents = Math.floor(policy.maxUnhedgedExposureCents / 4);
      const excessBaseCents = Math.max(0, unhedgedBaseCents - targetCents);
      const excessMinorUnits = Math.floor((excessBaseCents * 10000) / pos.rateToBaseBps);

      recommendedHedgeOrders.push({
        sellCurrency: pos.currency,
        buyCurrency: policy.baseCurrency,
        amountToHedgeMinorUnits: excessMinorUnits,
        recommendedOrderType:
          unhedgedBaseCents > policy.maxUnhedgedExposureCents ? "SPOT_CONVERSION" : "FORWARD_LOCK",
      });
    }
  }

  let status: FxExposureReport["status"] = "EXPOSURE_SAFE";
  if (totalUnhedgedBaseCents > policy.maxUnhedgedExposureCents) {
    status = "CRITICAL_UNHEDGED_DRIFT";
  } else if (totalUnhedgedBaseCents > (policy.maxUnhedgedExposureCents * 8) / 10) {
    status = "HEDGE_RECOMMENDED";
  }

  // RFC 6962 SHA-256 Merkle root of exposure assessment
  const preimage = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from(`${tenantId}|${policy.baseCurrency}|${totalUnhedgedBaseCents}|${status}`),
  ]);
  const reportMerkleRoot = createHash("sha256").update(preimage).digest("hex");

  return {
    tenantId,
    baseCurrency: policy.baseCurrency,
    totalUnhedgedExposureBaseCents: totalUnhedgedBaseCents,
    maxAllowableExposureCents: policy.maxUnhedgedExposureCents,
    status,
    breachingCurrencies,
    recommendedHedgeOrders,
    reportMerkleRoot,
  };
}
