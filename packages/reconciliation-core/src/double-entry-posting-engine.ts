/**
 * Deterministic Double-Entry Posting Engine
 *
 * Enforces zero-sum journal balancing on multi-rail settlement batches.
 * Guarantees sum(debits) === sum(credits) in strict integer cents with zero float drift.
 * Implements TigerBeetle transfer mapping and RFC 6962 Merkle tree sealing.
 */

import { createHash } from "node:crypto";
import { calculateRfc6962LeafHash } from "./threat-recognition-engine.js";

export type LedgerAccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type PostingDirection = "debit" | "credit";

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: LedgerAccountType;
  currency: string;
}

export interface JournalPostingLine {
  id: string;
  tenantId: string;
  accountId: string;
  accountType: LedgerAccountType;
  direction: PostingDirection;
  amountCents: bigint;
  currency: string;
  description: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface JournalBatchInput {
  batchId: string;
  tenantId: string;
  sourceRail: string;
  externalReference: string;
  effectiveDate: string | Date;
  lines: Array<{
    accountId: string;
    accountType: LedgerAccountType;
    direction: PostingDirection;
    amountCents: bigint;
    currency: string;
    description: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface FinalizedJournalBatch {
  batchId: string;
  tenantId: string;
  sourceRail: string;
  externalReference: string;
  postedAt: string;
  effectiveDate: string;
  lineCount: number;
  totalDebitCents: bigint;
  totalCreditCents: bigint;
  balanceDeltaCents: bigint;
  isZeroSumBalanced: boolean;
  merkleLeafHash: string;
  tigerbeetleTransferIds: string[];
  lines: JournalPostingLine[];
}

export class DoubleEntryImbalanceError extends Error {
  public readonly deltaCents: bigint;
  public readonly totalDebits: bigint;
  public readonly totalCredits: bigint;
  public readonly batchId: string;

  constructor(batchId: string, deltaCents: bigint, totalDebits: bigint, totalCredits: bigint) {
    super(
      `DoubleEntryImbalanceError: Batch '${batchId}' fails zero-sum balance invariant. Debits (${totalDebits.toString()} cents) != Credits (${totalCredits.toString()} cents), Delta = ${deltaCents.toString()} cents.`
    );
    this.name = "DoubleEntryImbalanceError";
    this.deltaCents = deltaCents;
    this.totalDebits = totalDebits;
    this.totalCredits = totalCredits;
    this.batchId = batchId;
  }
}

export class TenantMismatchError extends Error {
  constructor(expectedTenantId: string, actualTenantId: string, entityId: string) {
    super(
      `Tenant mismatch: Expected tenant '${expectedTenantId}' but entity '${entityId}' specified '${actualTenantId}'.`
    );
    this.name = "TenantMismatchError";
  }
}

/**
 * Standard Institutional Chart of Accounts for Payment Settlement
 */
export const STANDARD_CHART_OF_ACCOUNTS: Record<string, LedgerAccount> = {
  OPERATING_CASH: {
    id: "acct_1010",
    code: "1010",
    name: "Depository Operating Cash",
    type: "ASSET",
    currency: "USD",
  },
  STRIPE_CLEARING: {
    id: "acct_1020",
    code: "1020",
    name: "Stripe Settlement Clearing",
    type: "ASSET",
    currency: "USD",
  },
  PAYPAL_HOLDING: {
    id: "acct_1030",
    code: "1030",
    name: "PayPal Holding Balance",
    type: "ASSET",
    currency: "USD",
  },
  UNSETTLED_FLOAT_RESERVE: {
    id: "acct_1040",
    code: "1040",
    name: "Unsettled Payout In-Transit Float",
    type: "ASSET",
    currency: "USD",
  },
  MERCHANT_PAYABLE: {
    id: "acct_2010",
    code: "2010",
    name: "Merchant Settlement Payable",
    type: "LIABILITY",
    currency: "USD",
  },
  DISPUTE_COLLATERAL_HOLD: {
    id: "acct_2020",
    code: "2020",
    name: "Dispute & Chargeback Reserve Hold",
    type: "LIABILITY",
    currency: "USD",
  },
  INTERCHANGE_EXPENSE: {
    id: "acct_5010",
    code: "5010",
    name: "Card Interchange & Scheme Assessments",
    type: "EXPENSE",
    currency: "USD",
  },
  PROCESSOR_FEE_EXPENSE: {
    id: "acct_5020",
    code: "5020",
    name: "Payment Gateway Processing Fees",
    type: "EXPENSE",
    currency: "USD",
  },
  FX_SPREAD_EXPENSE: {
    id: "acct_5030",
    code: "5030",
    name: "Foreign Currency Conversion Spread Loss",
    type: "EXPENSE",
    currency: "USD",
  },
  SETTLEMENT_REVENUE: {
    id: "acct_4010",
    code: "4010",
    name: "Reconciliation & Settlement Platform Revenue",
    type: "REVENUE",
    currency: "USD",
  },
};

/**
 * Validates and finalizes a double-entry journal batch with strict zero-sum enforcement.
 */
export function postDoubleEntryBatch(input: JournalBatchInput): FinalizedJournalBatch {
  const { batchId, tenantId, sourceRail, externalReference, lines } = input;
  const effectiveDate = new Date(input.effectiveDate).toISOString();
  const postedAt = new Date().toISOString();

  let totalDebitCents = 0n;
  let totalCreditCents = 0n;

  const processedLines: JournalPostingLine[] = [];
  const tigerbeetleTransferIds: string[] = [];
  const lineHashAccumulator: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.amountCents < 0n) {
      throw new Error(
        `Invalid posting amount: line ${i} specifies negative amount ${line.amountCents.toString()}`
      );
    }

    if (line.direction === "debit") {
      totalDebitCents += line.amountCents;
    } else if (line.direction === "credit") {
      totalCreditCents += line.amountCents;
    } else {
      throw new Error(`Invalid posting direction: '${line.direction}'`);
    }

    const lineId = `post_${createHash("sha256").update(`${batchId}:${i}:${line.accountId}`).digest("hex").substring(0, 16)}`;
    const tbTransferId = `tb_${createHash("sha256").update(`${tenantId}:${batchId}:${lineId}`).digest("hex").substring(0, 32)}`;

    processedLines.push({
      id: lineId,
      tenantId,
      accountId: line.accountId,
      accountType: line.accountType,
      direction: line.direction,
      amountCents: line.amountCents,
      currency: line.currency,
      description: line.description,
      referenceId: line.referenceId,
      metadata: line.metadata,
    });

    tigerbeetleTransferIds.push(tbTransferId);
    lineHashAccumulator.push(`${line.accountId}:${line.direction}:${line.amountCents.toString()}`);
  }

  // INVARIANT 1: Strict Zero-Sum Journal Balance
  const deltaCents = totalDebitCents - totalCreditCents;
  if (deltaCents !== 0n) {
    throw new DoubleEntryImbalanceError(batchId, deltaCents, totalDebitCents, totalCreditCents);
  }

  // INVARIANT 2: RFC 6962 Merkle Leaf Hash of the balanced journal
  const batchDigestInput = `${tenantId}:${batchId}:${sourceRail}:${totalDebitCents.toString()}:${lineHashAccumulator.join("|")}`;
  const merkleLeafHash = calculateRfc6962LeafHash(batchDigestInput);

  return {
    batchId,
    tenantId,
    sourceRail,
    externalReference,
    postedAt,
    effectiveDate,
    lineCount: processedLines.length,
    totalDebitCents,
    totalCreditCents,
    balanceDeltaCents: 0n,
    isZeroSumBalanced: true,
    merkleLeafHash,
    tigerbeetleTransferIds,
    lines: processedLines,
  };
}

/**
 * Creates a standard bilateral settlement journal:
 * Decomposes gross settlement payout into bank cash, merchant payable, interchange expense, and processor fee.
 */
export function synthesizeBilateralSettlementJournal(params: {
  batchId: string;
  tenantId: string;
  rail: "stripe" | "paypal" | "adyen";
  grossSalesCents: bigint;
  interchangeFeeCents: bigint;
  processorCutCents: bigint;
  disputeReserveHoldCents: bigint;
  currency?: string;
  externalReference: string;
}): FinalizedJournalBatch {
  const currency = params.currency ?? "USD";
  const { grossSalesCents, interchangeFeeCents, processorCutCents, disputeReserveHoldCents } =
    params;

  // Net Cash Deposited = Gross - Interchange - ProcessorCut - ReserveHold
  const netCashDepositedCents =
    grossSalesCents - interchangeFeeCents - processorCutCents - disputeReserveHoldCents;

  const lines = [
    // 1. Debit Bank Operating Cash for actual net funds received
    {
      accountId: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.id,
      accountType: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.type,
      direction: "debit" as PostingDirection,
      amountCents: netCashDepositedCents,
      currency,
      description: `Net payout deposit from ${params.rail}`,
      referenceId: params.externalReference,
    },
    // 2. Debit Interchange Expense
    {
      accountId: STANDARD_CHART_OF_ACCOUNTS.INTERCHANGE_EXPENSE!.id,
      accountType: STANDARD_CHART_OF_ACCOUNTS.INTERCHANGE_EXPENSE!.type,
      direction: "debit" as PostingDirection,
      amountCents: interchangeFeeCents,
      currency,
      description: `Card scheme interchange assessments for ${params.rail}`,
      referenceId: params.externalReference,
    },
    // 3. Debit Processor Fee Expense
    {
      accountId: STANDARD_CHART_OF_ACCOUNTS.PROCESSOR_FEE_EXPENSE!.id,
      accountType: STANDARD_CHART_OF_ACCOUNTS.PROCESSOR_FEE_EXPENSE!.type,
      direction: "debit" as PostingDirection,
      amountCents: processorCutCents,
      currency,
      description: `Payment processor markup for ${params.rail}`,
      referenceId: params.externalReference,
    },
    // 4. Debit Dispute Collateral Hold (if any)
    ...(disputeReserveHoldCents > 0n
      ? [
          {
            accountId: STANDARD_CHART_OF_ACCOUNTS.DISPUTE_COLLATERAL_HOLD!.id,
            accountType: STANDARD_CHART_OF_ACCOUNTS.DISPUTE_COLLATERAL_HOLD!.type,
            direction: "debit" as PostingDirection,
            amountCents: disputeReserveHoldCents,
            currency,
            description: `Escrow dispute reserve withheld by ${params.rail}`,
            referenceId: params.externalReference,
          },
        ]
      : []),
    // 5. Credit Merchant Settlement Payable / Gross Sales Clearing
    {
      accountId: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.id,
      accountType: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.type,
      direction: "credit" as PostingDirection,
      amountCents: grossSalesCents,
      currency,
      description: `Gross merchant sales cleared via ${params.rail}`,
      referenceId: params.externalReference,
    },
  ];

  return postDoubleEntryBatch({
    batchId: params.batchId,
    tenantId: params.tenantId,
    sourceRail: params.rail,
    externalReference: params.externalReference,
    effectiveDate: new Date(),
    lines,
  });
}
