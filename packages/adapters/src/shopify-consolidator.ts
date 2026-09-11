/**
 * Shopify Multi-Store Payout Consolidator
 *
 * Reconciles and aggregates Shopify Payments payouts across multi-currency international store footprints
 * (e.g., US, UK, EU, APAC) for unified enterprise general ledger posting.
 * Enforces strict integer cents arithmetic, store-level fee deconstruction, and RFC 6962 SHA-256 Merkle root attestation.
 */

import { createHash } from "node:crypto";

export interface ShopifyStorePayout {
  storeId: string;
  storeName: string;
  payoutId: string;
  currency: string;
  grossSalesCents: bigint;
  refundsCents: bigint;
  processingFeesCents: bigint;
  taxCollectedCents: bigint;
  reserveHoldCents: bigint;
  netPayoutCents: bigint;
  payoutDate: string;
  exchangeRateBpsToBase: number; // e.g. 10000 = 1.0000, 12500 = 1.2500
}

export interface ConsolidatedShopifyReport {
  tenantId: string;
  baseCurrency: string;
  asOfDate: string;
  storesIncluded: number;
  totalGrossSalesBaseCents: bigint;
  totalRefundsBaseCents: bigint;
  totalProcessingFeesBaseCents: bigint;
  totalTaxesBaseCents: bigint;
  totalReservesBaseCents: bigint;
  totalNetPayoutBaseCents: bigint;
  isZeroVarianceBalanced: boolean;
  merkleBatchRoot: string;
  storeSummaries: Array<{
    storeId: string;
    storeName: string;
    originalCurrency: string;
    originalNetCents: bigint;
    convertedNetBaseCents: bigint;
    effectiveFeeBps: number;
  }>;
}

/**
 * Consolidates payouts from multiple international Shopify stores into a single base-currency ledger batch.
 */
export function consolidateShopifyPayouts(
  tenantId: string,
  payouts: ShopifyStorePayout[],
  baseCurrency = "USD"
): ConsolidatedShopifyReport {
  let totalGross = 0n;
  let totalRefunds = 0n;
  let totalFees = 0n;
  let totalTaxes = 0n;
  let totalReserves = 0n;
  let totalNet = 0n;

  const storeSummaries: ConsolidatedShopifyReport["storeSummaries"] = [];
  const leafHashes: string[] = [];

  for (const payout of payouts) {
    // Validate store-level balance equation: Net = Gross - Refunds - Fees - Reserves
    const calculatedNet =
      payout.grossSalesCents -
      payout.refundsCents -
      payout.processingFeesCents -
      payout.reserveHoldCents;

    if (calculatedNet !== payout.netPayoutCents) {
      throw new Error(
        `Shopify store '${payout.storeId}' payout balance mismatch: computed ${calculatedNet} vs reported ${payout.netPayoutCents} cents`
      );
    }

    // Convert to base currency using integer basis points
    // converted = (original * rateBps) / 10000
    const convertedGross = (payout.grossSalesCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;
    const convertedRefunds = (payout.refundsCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;
    const convertedFees =
      (payout.processingFeesCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;
    const convertedTaxes =
      (payout.taxCollectedCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;
    const convertedReserves =
      (payout.reserveHoldCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;
    const convertedNet = (payout.netPayoutCents * BigInt(payout.exchangeRateBpsToBase)) / 10000n;

    totalGross += convertedGross;
    totalRefunds += convertedRefunds;
    totalFees += convertedFees;
    totalTaxes += convertedTaxes;
    totalReserves += convertedReserves;
    totalNet += convertedNet;

    const feeBps =
      payout.grossSalesCents > 0n
        ? Number((payout.processingFeesCents * 10000n) / payout.grossSalesCents)
        : 0;

    storeSummaries.push({
      storeId: payout.storeId,
      storeName: payout.storeName,
      originalCurrency: payout.currency,
      originalNetCents: payout.netPayoutCents,
      convertedNetBaseCents: convertedNet,
      effectiveFeeBps: feeBps,
    });

    const leafData = `${tenantId}:${payout.storeId}:${payout.payoutId}:${payout.currency}:${payout.netPayoutCents.toString()}:${payout.exchangeRateBpsToBase}`;
    const leafHash = createHash("sha256")
      .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(leafData, "utf-8")]))
      .digest("hex");
    leafHashes.push(leafHash);
  }

  // Calculate RFC 6962 batch Merkle root
  leafHashes.sort();
  let merkleBatchRoot = "0000000000000000000000000000000000000000000000000000000000000000";
  if (leafHashes.length > 0) {
    let currentLevel = leafHashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]!;
        const right = currentLevel[i + 1] ?? left;
        const combined = createHash("sha256")
          .update(Buffer.concat([Buffer.from([0x01]), Buffer.from(left + right, "hex")]))
          .digest("hex");
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    merkleBatchRoot = currentLevel[0]!;
  }

  // Balance assertion: Net == Gross - Refunds - Fees - Reserves
  const expectedConsolidatedNet = totalGross - totalRefunds - totalFees - totalReserves;
  const isZeroVarianceBalanced = totalNet === expectedConsolidatedNet;

  return {
    tenantId,
    baseCurrency,
    asOfDate: new Date().toISOString(),
    storesIncluded: payouts.length,
    totalGrossSalesBaseCents: totalGross,
    totalRefundsBaseCents: totalRefunds,
    totalProcessingFeesBaseCents: totalFees,
    totalTaxesBaseCents: totalTaxes,
    totalReservesBaseCents: totalReserves,
    totalNetPayoutBaseCents: totalNet,
    isZeroVarianceBalanced,
    merkleBatchRoot,
    storeSummaries,
  };
}
