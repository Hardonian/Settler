import { consolidateShopifyPayouts, type ShopifyStorePayout } from "../shopify-consolidator";

describe("Shopify Multi-Store Payout Consolidator", () => {
  it("consolidates payouts across US, UK, and EU Shopify storefronts into USD base currency", () => {
    const payouts: ShopifyStorePayout[] = [
      {
        storeId: "store_us",
        storeName: "Acme US Flagship",
        payoutId: "po_us_101",
        currency: "USD",
        grossSalesCents: 1000000n, // $10,000.00
        refundsCents: 50000n, // $500.00
        processingFeesCents: 29000n, // $290.00 (2.9%)
        taxCollectedCents: 80000n, // $800.00
        reserveHoldCents: 0n,
        netPayoutCents: 921000n, // $9,210.00 ($10,000 - $500 - $290)
        payoutDate: "2026-09-10",
        exchangeRateBpsToBase: 10000, // 1.0000 USD/USD
      },
      {
        storeId: "store_uk",
        storeName: "Acme UK Store",
        payoutId: "po_uk_202",
        currency: "GBP",
        grossSalesCents: 500000n, // £5,000.00
        refundsCents: 20000n, // £200.00
        processingFeesCents: 15000n, // £150.00 (3.0%)
        taxCollectedCents: 100000n, // £1,000.00 VAT
        reserveHoldCents: 10000n, // £100.00 reserve
        netPayoutCents: 455000n, // £4,550.00 (£5,000 - £200 - £150 - £100)
        payoutDate: "2026-09-10",
        exchangeRateBpsToBase: 13000, // 1.3000 USD/GBP
      },
      {
        storeId: "store_eu",
        storeName: "Acme EU Store",
        payoutId: "po_eu_303",
        currency: "EUR",
        grossSalesCents: 800000n, // €8,000.00
        refundsCents: 40000n, // €400.00
        processingFeesCents: 24000n, // €240.00 (3.0%)
        taxCollectedCents: 160000n, // €1,600.00 VAT
        reserveHoldCents: 0n,
        netPayoutCents: 736000n, // €7,360.00 (€8,000 - €400 - €240)
        payoutDate: "2026-09-10",
        exchangeRateBpsToBase: 11000, // 1.1000 USD/EUR
      },
    ];

    const report = consolidateShopifyPayouts("tenant_acme_corp", payouts, "USD");

    expect(report.storesIncluded).toBe(3);
    expect(report.tenantId).toBe("tenant_acme_corp");
    expect(report.baseCurrency).toBe("USD");
    expect(report.isZeroVarianceBalanced).toBe(true);
    expect(report.merkleBatchRoot).toMatch(/^[a-f0-9]{64}$/);

    // US net = 921000 * 1.0 = 921,000 cents ($9,210.00)
    // UK net = (455000 * 13000) / 10000 = 591,500 cents ($5,915.00)
    // EU net = (736000 * 11000) / 10000 = 809,600 cents ($8,096.00)
    // Total net = 921000 + 591500 + 809600 = 2,322,100 cents ($23,221.00)
    expect(report.totalNetPayoutBaseCents).toBe(2322100n);

    expect(report.storeSummaries.length).toBe(3);
    expect(report.storeSummaries[0]?.effectiveFeeBps).toBe(290); // 2.9%
  });

  it("throws error when store-level math does not balance", () => {
    const invalidPayouts: ShopifyStorePayout[] = [
      {
        storeId: "store_corrupt",
        storeName: "Corrupt Store",
        payoutId: "po_err",
        currency: "USD",
        grossSalesCents: 10000n,
        refundsCents: 1000n,
        processingFeesCents: 300n,
        taxCollectedCents: 500n,
        reserveHoldCents: 0n,
        netPayoutCents: 999999n, // Corrupted net figure
        payoutDate: "2026-09-10",
        exchangeRateBpsToBase: 10000,
      },
    ];

    expect(() => consolidateShopifyPayouts("tenant_test", invalidPayouts)).toThrow(
      /Shopify store 'store_corrupt' payout balance mismatch/
    );
  });
});
