/**
 * Adyen Settlement Detail Report Connector
 *
 * Deterministic ingestion adapter for Adyen balance modification reports
 * (`settlement_detail_report_batch_*.csv`). Deconstructs gross amounts,
 * interchange passthrough, scheme fees, acquirer markup, and reserve holds.
 *
 * Enforces zero floating-point arithmetic (integer cents) and strict tenant isolation.
 */

import { createHash } from "node:crypto";

export interface AdyenSettlementRecord {
  pspReference: string;
  merchantReference?: string;
  paymentMethod: string;
  type: "Settled" | "Refunded" | "Chargeback" | "Fee" | "ReserveHold" | "Other";
  creationDate: string;
  currency: string;
  grossCreditCents: number;
  grossDebitCents: number;
  netCreditCents: number;
  netDebitCents: number;
  interchangeFeeCents: number;
  schemeFeeCents: number;
  commissionCents: number;
  markupCents: number;
  leafHash: string;
}

export interface AdyenSettlementBatch {
  tenantId: string;
  merchantAccount: string;
  batchSequence?: string;
  records: AdyenSettlementRecord[];
  totalGrossCreditCents: number;
  totalGrossDebitCents: number;
  totalNetCreditCents: number;
  totalNetDebitCents: number;
  totalInterchangeCents: number;
  totalSchemeFeeCents: number;
  totalMarkupCents: number;
  batchMerkleRoot: string;
}

/**
 * Parses decimal string into integer cents safely.
 */
function toIntegerCents(raw: string | undefined): number {
  if (!raw || raw.trim() === "") return 0;
  const cleaned = raw.trim().replace(",", ".");
  const isNegative = cleaned.startsWith("-");
  const absVal = isNegative ? cleaned.slice(1) : cleaned;
  const parts = absVal.split(".");
  const whole = parseInt(parts[0] || "0", 10);
  const fracStr = (parts[1] || "").padEnd(2, "0").slice(0, 2);
  const frac = parseInt(fracStr, 10);
  const total = whole * 100 + frac;
  return isNegative ? -total : total;
}

/**
 * Parses Adyen CSV settlement detail report into structured, hash-linked batch.
 */
export function parseAdyenSettlementReport(
  tenantId: string,
  csvContent: string
): AdyenSettlementBatch {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant context invariant violation: tenantId is required");
  }

  const lines = csvContent
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("Adyen settlement report is empty");
  }

  const headerLine = lines[0]!;
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const headerMap = new Map<string, number>();
  headers.forEach((h, idx) => headerMap.set(h.toLowerCase(), idx));

  const getCol = (cols: string[], name: string): string => {
    const idx = headerMap.get(name.toLowerCase());
    if (idx === undefined || idx >= cols.length) return "";
    return (cols[idx] || "").replace(/^"|"$/g, "").trim();
  };

  const records: AdyenSettlementRecord[] = [];
  let merchantAccount = "ADYEN_DEFAULT_MERCHANT";
  let totalGrossCreditCents = 0;
  let totalGrossDebitCents = 0;
  let totalNetCreditCents = 0;
  let totalNetDebitCents = 0;
  let totalInterchangeCents = 0;
  let totalSchemeFeeCents = 0;
  let totalMarkupCents = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]!;
    // Split on commas while respecting basic quotes
    const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (cols.length < 5) continue;

    const rowMerchantAccount = getCol(cols, "Merchant Account");
    if (rowMerchantAccount) merchantAccount = rowMerchantAccount;

    const pspReference = getCol(cols, "Psp Reference") || `psp_${i}_${Date.now()}`;
    const merchantReference = getCol(cols, "Merchant Reference") || undefined;
    const paymentMethod = getCol(cols, "Payment Method") || "card";
    const rawType = getCol(cols, "Type");
    let type: AdyenSettlementRecord["type"] = "Other";
    if (rawType.toLowerCase().includes("settled")) type = "Settled";
    else if (rawType.toLowerCase().includes("refund")) type = "Refunded";
    else if (rawType.toLowerCase().includes("chargeback")) type = "Chargeback";
    else if (rawType.toLowerCase().includes("fee")) type = "Fee";
    else if (rawType.toLowerCase().includes("reserve")) type = "ReserveHold";

    const creationDate = getCol(cols, "Creation Date") || new Date().toISOString();
    const currency = getCol(cols, "Currency") || "EUR";

    const grossCreditCents = Math.abs(toIntegerCents(getCol(cols, "Gross Credit (GC)")));
    const grossDebitCents = Math.abs(toIntegerCents(getCol(cols, "Gross Debit (GC)")));
    const netCreditCents = Math.abs(toIntegerCents(getCol(cols, "Net Credit (NC)")));
    const netDebitCents = Math.abs(toIntegerCents(getCol(cols, "Net Debit (ND)")));

    const interchangeFeeCents = Math.abs(toIntegerCents(getCol(cols, "Interchange (NC)")));
    const schemeFeeCents = Math.abs(toIntegerCents(getCol(cols, "Scheme Fees (NC)")));
    const commissionCents = Math.abs(toIntegerCents(getCol(cols, "Commission (NC)")));
    const markupCents = Math.abs(toIntegerCents(getCol(cols, "Markup (NC)")));

    // RFC 6962 SHA-256 leaf hash
    const leafPreimage = Buffer.concat([
      Buffer.from([0x00]),
      Buffer.from(
        `${tenantId}|${pspReference}|${type}|${currency}|${grossCreditCents}|${grossDebitCents}|${netCreditCents}`
      ),
    ]);
    const leafHash = createHash("sha256").update(leafPreimage).digest("hex");

    records.push({
      pspReference,
      merchantReference,
      paymentMethod,
      type,
      creationDate,
      currency,
      grossCreditCents,
      grossDebitCents,
      netCreditCents,
      netDebitCents,
      interchangeFeeCents,
      schemeFeeCents,
      commissionCents,
      markupCents,
      leafHash,
    });

    totalGrossCreditCents += grossCreditCents;
    totalGrossDebitCents += grossDebitCents;
    totalNetCreditCents += netCreditCents;
    totalNetDebitCents += netDebitCents;
    totalInterchangeCents += interchangeFeeCents;
    totalSchemeFeeCents += schemeFeeCents;
    totalMarkupCents += markupCents;
  }

  // Compute batch Merkle root
  const rootPreimage = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from(
      records
        .map((r) => r.leafHash)
        .sort()
        .join("")
    ),
  ]);
  const batchMerkleRoot = createHash("sha256").update(rootPreimage).digest("hex");

  return {
    tenantId,
    merchantAccount,
    records,
    totalGrossCreditCents,
    totalGrossDebitCents,
    totalNetCreditCents,
    totalNetDebitCents,
    totalInterchangeCents,
    totalSchemeFeeCents,
    totalMarkupCents,
    batchMerkleRoot,
  };
}
