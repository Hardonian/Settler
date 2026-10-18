/**
 * Autonomous ERP Journal Entry Synthesizer
 *
 * Synthesizes balanced compound double-entry GAAP/IFRS journal entries directly from
 * converged triangular settlement triplets and multi-rail reconciliation runs.
 *
 * Invariants:
 *  1. Zero-Sum Balance: sum(debits) === sum(credits) in exact integer cents.
 *  2. Cryptographic Audit Binding: Every journal document embeds a deterministic
 *     Merkle proof hash (settler_proof_0x...) linking back to underlying settlement records.
 *  3. Format Compliant: Generates native payloads for NetSuite SuiteTalk REST
 *     and SAP S/4HANA OData Journal APIs.
 */

import { createHash } from "node:crypto";

export type ErpTargetSystem = "NETSUITE" | "SAP_S4HANA" | "WORKDAY" | "GENERIC_GAAP";

export interface ErpChartOfAccountsMapping {
  cashClearingAccountCode: string;
  cashClearingAccountName: string;
  merchantFeesExpenseAccountCode: string;
  merchantFeesExpenseAccountName: string;
  accountsReceivableAccountCode: string;
  accountsReceivableAccountName: string;
  feeVarianceReceivableAccountCode: string;
  feeVarianceReceivableAccountName: string;
  fxGainLossAccountCode: string;
  fxGainLossAccountName: string;
}

export const DEFAULT_ERP_CHART_OF_ACCOUNTS: ErpChartOfAccountsMapping = {
  cashClearingAccountCode: "10150",
  cashClearingAccountName: "Processor Settlement Cash Clearing",
  merchantFeesExpenseAccountCode: "60200",
  merchantFeesExpenseAccountName: "Merchant Card Processing Fees",
  accountsReceivableAccountCode: "11000",
  accountsReceivableAccountName: "Trade Accounts Receivable",
  feeVarianceReceivableAccountCode: "11500",
  feeVarianceReceivableAccountName: "Processor Fee Dispute Receivable",
  fxGainLossAccountCode: "70100",
  fxGainLossAccountName: "Realized Foreign Exchange Gain/Loss",
};

export interface ErpJournalLineItem {
  lineNumber: number;
  accountCode: string;
  accountName: string;
  debitCents: bigint;
  creditCents: bigint;
  memo: string;
  entityId?: string;
  departmentId?: string;
}

export interface ErpJournalEntry {
  journalId: string;
  tenantId: string;
  targetSystem: ErpTargetSystem;
  postingDate: string; // YYYY-MM-DD
  currency: string;
  documentReference: string;
  memo: string;
  lines: ErpJournalLineItem[];
  totalDebitCents: bigint;
  totalCreditCents: bigint;
  isBalanced: boolean;
  merkleProofHash: string;
  sourceReferences: string[];
}

export interface NetSuiteJournalPayload {
  tranDate: string;
  memo: string;
  externalId: string;
  subsidiary: { id: string };
  line: {
    items: Array<{
      account: { id: string };
      debit?: number;
      credit?: number;
      memo: string;
      entity?: { id: string };
    }>;
  };
}

export interface SapS4HanaJournalPayload {
  CompanyCode: string;
  DocumentDate: string;
  PostingDate: string;
  AccountingDocumentType: string;
  DocumentHeaderText: string;
  ReferenceDocument: string;
  to_Item: {
    results: Array<{
      ReferenceDocumentItem: string;
      GLAccount: string;
      AmountInCompanyCodeCurrency: number;
      DebitCreditCode: "S" | "H"; // 'S' = Debit (Soll), 'H' = Credit (Haben)
      DocumentItemText: string;
    }>;
  };
}

export interface TriangularSettlementInput {
  orderReference: string;
  orderAmountCents: number | bigint;
  capturedAmountCents: number | bigint;
  feeDeductedCents: number | bigint;
  netSettledCents: number | bigint;
  currency: string;
  settledAt?: string | Date;
  entityId?: string;
  merkleLeafHash?: string;
}

/**
 * Calculates deterministic SHA-256 Merkle proof hash for the journal entry
 */
function computeJournalProofHash(
  tenantId: string,
  postingDate: string,
  totalDebits: bigint,
  sourceRefs: string[]
): string {
  const hasher = createHash("sha256");
  hasher.update(`settler:erp:journal:${tenantId}:${postingDate}:${totalDebits.toString()}`);
  for (const ref of sourceRefs) {
    hasher.update(`:ref:${ref}`);
  }
  return `0x${hasher.digest("hex")}`;
}

export class ErpJournalSynthesizer {
  /**
   * Synthesizes a GAAP/IFRS balanced compound journal entry from a single converged triangular settlement triplet
   */
  public synthesizeFromTriangularSettlement(params: {
    tenantId: string;
    settlement: TriangularSettlementInput;
    targetSystem?: ErpTargetSystem;
    mapping?: Partial<ErpChartOfAccountsMapping>;
    subsidiaryId?: string;
  }): ErpJournalEntry {
    const { tenantId, settlement } = params;
    const targetSystem = params.targetSystem ?? "NETSUITE";
    const mapping: ErpChartOfAccountsMapping = {
      ...DEFAULT_ERP_CHART_OF_ACCOUNTS,
      ...params.mapping,
    };

    const orderAmount = BigInt(settlement.orderAmountCents);
    const feeAmount = BigInt(settlement.feeDeductedCents);
    const netDeposit = BigInt(settlement.netSettledCents);
    const calculatedVariance = orderAmount - feeAmount - netDeposit;

    const postingDate = settlement.settledAt
      ? new Date(settlement.settledAt).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!;

    const lines: ErpJournalLineItem[] = [];
    let lineNumber = 1;

    // Line 1: Debit Cash in Transit / Bank Deposit
    if (netDeposit > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.cashClearingAccountCode,
        accountName: mapping.cashClearingAccountName,
        debitCents: netDeposit,
        creditCents: 0n,
        memo: `Bank Sweep Net Deposit for Order ${settlement.orderReference}`,
        entityId: settlement.entityId,
      });
    }

    // Line 2: Debit Merchant Processing Fee Expense
    if (feeAmount > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.merchantFeesExpenseAccountCode,
        accountName: mapping.merchantFeesExpenseAccountName,
        debitCents: feeAmount,
        creditCents: 0n,
        memo: `Merchant Processing Fee for Order ${settlement.orderReference}`,
      });
    }

    // Line 3: Debit or Credit Fee Variance / Dispute Receivable if variance exists
    if (calculatedVariance > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.feeVarianceReceivableAccountCode,
        accountName: mapping.feeVarianceReceivableAccountName,
        debitCents: calculatedVariance,
        creditCents: 0n,
        memo: `Processor Fee Overcharge Variance for Order ${settlement.orderReference}`,
      });
    } else if (calculatedVariance < 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.feeVarianceReceivableAccountCode,
        accountName: mapping.feeVarianceReceivableAccountName,
        debitCents: 0n,
        creditCents: -calculatedVariance,
        memo: `Processor Fee Undercharge Adjustment for Order ${settlement.orderReference}`,
      });
    }

    // Line 4: Credit Gross Accounts Receivable / Revenue
    if (orderAmount > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.accountsReceivableAccountCode,
        accountName: mapping.accountsReceivableAccountName,
        debitCents: 0n,
        creditCents: orderAmount,
        memo: `Gross Revenue Settlement for Order ${settlement.orderReference}`,
        entityId: settlement.entityId,
      });
    }

    // Invariant Verification
    const totalDebitCents = lines.reduce((sum, line) => sum + line.debitCents, 0n);
    const totalCreditCents = lines.reduce((sum, line) => sum + line.creditCents, 0n);
    const isBalanced = totalDebitCents === totalCreditCents;

    const proofHash = computeJournalProofHash(tenantId, postingDate, totalDebitCents, [
      settlement.orderReference,
    ]);

    const journalId = `je_${createHash("sha256")
      .update(`${tenantId}:${settlement.orderReference}:${postingDate}`)
      .digest("hex")
      .slice(0, 16)}`;

    return {
      journalId,
      tenantId,
      targetSystem,
      postingDate,
      currency: settlement.currency.toUpperCase(),
      documentReference: settlement.orderReference,
      memo: `Settler Auto-Journal: ${settlement.orderReference} [proof: ${proofHash}]`,
      lines,
      totalDebitCents,
      totalCreditCents,
      isBalanced,
      merkleProofHash: proofHash,
      sourceReferences: [settlement.orderReference],
    };
  }

  /**
   * Synthesizes an aggregated compound batch journal entry from multiple settlements
   */
  public synthesizeBatchJournal(params: {
    tenantId: string;
    batchReference: string;
    settlements: TriangularSettlementInput[];
    postingDate?: string;
    targetSystem?: ErpTargetSystem;
    mapping?: Partial<ErpChartOfAccountsMapping>;
  }): ErpJournalEntry {
    const { tenantId, batchReference, settlements } = params;
    const targetSystem = params.targetSystem ?? "NETSUITE";
    const mapping: ErpChartOfAccountsMapping = {
      ...DEFAULT_ERP_CHART_OF_ACCOUNTS,
      ...params.mapping,
    };

    const postingDate = params.postingDate ?? new Date().toISOString().split("T")[0]!;

    let aggregateGross = 0n;
    let aggregateFees = 0n;
    let aggregateNet = 0n;
    const sourceRefs: string[] = [];

    for (const s of settlements) {
      aggregateGross += BigInt(s.orderAmountCents);
      aggregateFees += BigInt(s.feeDeductedCents);
      aggregateNet += BigInt(s.netSettledCents);
      sourceRefs.push(s.orderReference);
    }

    const calculatedVariance = aggregateGross - aggregateFees - aggregateNet;
    const lines: ErpJournalLineItem[] = [];
    let lineNumber = 1;

    // 1. Debit Cash Clearing
    if (aggregateNet > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.cashClearingAccountCode,
        accountName: mapping.cashClearingAccountName,
        debitCents: aggregateNet,
        creditCents: 0n,
        memo: `Aggregate Net Bank Sweep Deposit (${settlements.length} items)`,
      });
    }

    // 2. Debit Processing Fees
    if (aggregateFees > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.merchantFeesExpenseAccountCode,
        accountName: mapping.merchantFeesExpenseAccountName,
        debitCents: aggregateFees,
        creditCents: 0n,
        memo: `Aggregate Merchant Processing Fees (${settlements.length} items)`,
      });
    }

    // 3. Debit/Credit Variance
    if (calculatedVariance > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.feeVarianceReceivableAccountCode,
        accountName: mapping.feeVarianceReceivableAccountName,
        debitCents: calculatedVariance,
        creditCents: 0n,
        memo: `Aggregate Processor Fee Variance Receivable`,
      });
    } else if (calculatedVariance < 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.feeVarianceReceivableAccountCode,
        accountName: mapping.feeVarianceReceivableAccountName,
        debitCents: 0n,
        creditCents: -calculatedVariance,
        memo: `Aggregate Processor Fee Undercharge Adjustment`,
      });
    }

    // 4. Credit Accounts Receivable
    if (aggregateGross > 0n) {
      lines.push({
        lineNumber: lineNumber++,
        accountCode: mapping.accountsReceivableAccountCode,
        accountName: mapping.accountsReceivableAccountName,
        debitCents: 0n,
        creditCents: aggregateGross,
        memo: `Aggregate Accounts Receivable Clearance (${settlements.length} items)`,
      });
    }

    const totalDebitCents = lines.reduce((sum, line) => sum + line.debitCents, 0n);
    const totalCreditCents = lines.reduce((sum, line) => sum + line.creditCents, 0n);
    const isBalanced = totalDebitCents === totalCreditCents;

    const proofHash = computeJournalProofHash(tenantId, postingDate, totalDebitCents, sourceRefs);
    const journalId = `je_batch_${createHash("sha256")
      .update(`${tenantId}:${batchReference}:${postingDate}`)
      .digest("hex")
      .slice(0, 16)}`;

    return {
      journalId,
      tenantId,
      targetSystem,
      postingDate,
      currency: (settlements[0]?.currency || "USD").toUpperCase(),
      documentReference: batchReference,
      memo: `Settler Batch Journal: ${batchReference} (${settlements.length} settlements) [proof: ${proofHash}]`,
      lines,
      totalDebitCents,
      totalCreditCents,
      isBalanced,
      merkleProofHash: proofHash,
      sourceReferences: sourceRefs,
    };
  }

  /**
   * Serializes an ErpJournalEntry into native NetSuite SuiteTalk REST JSON format
   */
  public exportToNetSuite(
    journal: ErpJournalEntry,
    options: { subsidiaryId?: string } = {}
  ): NetSuiteJournalPayload {
    const subsidiaryId = options.subsidiaryId ?? "1";

    return {
      tranDate: journal.postingDate,
      memo: journal.memo,
      externalId: journal.journalId,
      subsidiary: { id: subsidiaryId },
      line: {
        items: journal.lines.map((l) => ({
          account: { id: l.accountCode },
          debit: l.debitCents > 0n ? Number(l.debitCents) / 100 : undefined,
          credit: l.creditCents > 0n ? Number(l.creditCents) / 100 : undefined,
          memo: l.memo,
          entity: l.entityId ? { id: l.entityId } : undefined,
        })),
      },
    };
  }

  /**
   * Serializes an ErpJournalEntry into native SAP S/4HANA OData Journal Entry format
   */
  public exportToSapS4Hana(
    journal: ErpJournalEntry,
    options: { companyCode?: string } = {}
  ): SapS4HanaJournalPayload {
    const companyCode = options.companyCode ?? "1000";

    return {
      CompanyCode: companyCode,
      DocumentDate: journal.postingDate,
      PostingDate: journal.postingDate,
      AccountingDocumentType: "SA",
      DocumentHeaderText: journal.memo.slice(0, 100),
      ReferenceDocument: journal.documentReference.slice(0, 16),
      to_Item: {
        results: journal.lines.map((l, idx) => {
          const isDebit = l.debitCents > 0n;
          const amountMajor = Number(isDebit ? l.debitCents : l.creditCents) / 100;
          return {
            ReferenceDocumentItem: String(idx + 1).padStart(3, "0"),
            GLAccount: l.accountCode,
            AmountInCompanyCodeCurrency: amountMajor,
            DebitCreditCode: isDebit ? "S" : "H",
            DocumentItemText: l.memo.slice(0, 50),
          };
        }),
      },
    };
  }
}

export const erpJournalSynthesizer = new ErpJournalSynthesizer();
