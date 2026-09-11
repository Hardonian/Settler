import {
  VendorReconciliationEngine,
  VendorInvoice,
  VendorPaymentReceipt,
} from "../vendor-reconciliation";

describe("Vendor Statement Reconciliation Engine (#76)", () => {
  const tenantId = "tenant_enterprise_b2b";

  const sampleInvoices: VendorInvoice[] = [
    {
      invoiceId: "inv_aws_2026_08",
      tenantId,
      vendorName: "Amazon Web Services",
      invoiceNumber: "AWS-987654321",
      invoiceDate: "2026-08-31T23:59:59Z",
      currency: "USD",
      subtotalCents: 450000, // $4,500.00
      taxCents: 0,
      totalCents: 450000,
      lineItems: [
        {
          lineId: "line_1",
          description: "Amazon EC2 Compute",
          category: "compute",
          quantity: 1,
          unitPriceCents: 350000,
          totalAmountCents: 350000,
        },
        {
          lineId: "line_2",
          description: "Amazon S3 Storage",
          category: "storage",
          quantity: 1,
          unitPriceCents: 100000,
          totalAmountCents: 100000,
        },
      ],
    },
    {
      invoiceId: "inv_datadog_2026_08",
      tenantId,
      vendorName: "Datadog",
      invoiceNumber: "DD-2026-9912",
      invoiceDate: "2026-08-31T00:00:00Z",
      currency: "USD",
      subtotalCents: 120000, // $1,200.00
      taxCents: 10800, // $108.00 (9% tax)
      totalCents: 130800, // $1,308.00
      lineItems: [
        {
          lineId: "line_dd_1",
          description: "Infrastructure Pro Plan",
          category: "license",
          quantity: 80,
          unitPriceCents: 1500,
          totalAmountCents: 120000,
        },
      ],
    },
    {
      invoiceId: "inv_snowflake_2026_08",
      tenantId,
      vendorName: "Snowflake",
      invoiceNumber: "SNOW-8841",
      invoiceDate: "2026-08-31T00:00:00Z",
      currency: "USD",
      subtotalCents: 300000,
      taxCents: 0,
      totalCents: 300000,
      lineItems: [],
    },
  ];

  const samplePayments: VendorPaymentReceipt[] = [
    {
      paymentId: "pmt_corp_card_1",
      tenantId,
      sourceRail: "corporate_card",
      paymentDate: "2026-09-02T14:30:00Z",
      amountCents: 450000,
      currency: "USD",
      referenceNumber: "AWS-987654321",
      descriptor: "AWS EMEA/AMAZON WEB SERVICES",
    },
    {
      paymentId: "pmt_corp_card_2",
      tenantId,
      sourceRail: "corporate_card",
      paymentDate: "2026-09-03T11:00:00Z",
      amountCents: 130800,
      currency: "USD",
      descriptor: "DATADOG INC DD-2026-9912",
    },
    {
      paymentId: "pmt_ach_debit_unknown",
      tenantId,
      sourceRail: "ach_debit",
      paymentDate: "2026-09-04T09:00:00Z",
      amountCents: 4999,
      currency: "USD",
      descriptor: "UNRECOGNIZED SAAS TOOL SUBSCRIPTION",
    },
  ];

  it("reconciles vendor invoices against corporate card payments with exact matches and Merkle root sealing", () => {
    const report = VendorReconciliationEngine.reconcile(tenantId, sampleInvoices, samplePayments);

    expect(report.tenantId).toBe(tenantId);
    expect(report.totalInvoices).toBe(3);
    expect(report.totalPayments).toBe(3);
    expect(report.matchedCount).toBe(2);
    expect(report.unmatchedCount).toBe(2); // 1 unmatched invoice (Snowflake), 1 unmatched payment

    // Validate AWS exact match
    const awsMatch = report.results.find((r) => r.invoiceId === "inv_aws_2026_08");
    expect(awsMatch).toBeDefined();
    expect(awsMatch?.status).toBe("EXACT_MATCH");
    expect(awsMatch?.paymentId).toBe("pmt_corp_card_1");
    expect(awsMatch?.varianceCents).toBe(0);
    expect(awsMatch?.confidenceScore).toBeGreaterThanOrEqual(90);

    // Validate Datadog match
    const datadogMatch = report.results.find((r) => r.invoiceId === "inv_datadog_2026_08");
    expect(datadogMatch).toBeDefined();
    expect(datadogMatch?.status).toBe("EXACT_MATCH");
    expect(datadogMatch?.paymentId).toBe("pmt_corp_card_2");
    expect(datadogMatch?.paymentAmountCents).toBe(130800);

    // Validate Snowflake unmatched invoice
    const snowMatch = report.results.find((r) => r.invoiceId === "inv_snowflake_2026_08");
    expect(snowMatch).toBeDefined();
    expect(snowMatch?.status).toBe("UNMATCHED_INVOICE");

    // Validate Merkle root is non-empty 64-char hex
    expect(report.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
  });

  it("detects price creep compared to prior period invoices", () => {
    const priorInvoices: VendorInvoice[] = [
      {
        invoiceId: "inv_aws_prior",
        tenantId,
        vendorName: "Amazon Web Services",
        invoiceNumber: "AWS-PREV",
        invoiceDate: "2026-07-31T00:00:00Z",
        currency: "USD",
        subtotalCents: 300000, // $3,000.00
        taxCents: 0,
        totalCents: 300000,
        lineItems: [],
      },
    ];

    // Current AWS is 450000 (+50% increase > 15% threshold)
    const report = VendorReconciliationEngine.reconcile(
      tenantId,
      sampleInvoices.slice(0, 1),
      samplePayments.slice(0, 1),
      { priorMonthInvoices: priorInvoices, priceCreepThresholdBps: 1500 }
    );

    const awsMatch = report.results.find((r) => r.invoiceId === "inv_aws_2026_08");
    expect(awsMatch?.status).toBe("PRICE_CREEP_FLAG");
    expect(awsMatch?.notes).toContain("Warning: 50% price increase");
  });

  it("strictly enforces tenant isolation and throws on cross-tenant entity leakage", () => {
    const leakInvoices: VendorInvoice[] = [
      {
        ...sampleInvoices[0]!,
        tenantId: "cross_tenant_malicious",
      },
    ];

    expect(() => {
      VendorReconciliationEngine.reconcile(tenantId, leakInvoices, samplePayments);
    }).toThrow(/Tenant mismatch/);
  });
});
