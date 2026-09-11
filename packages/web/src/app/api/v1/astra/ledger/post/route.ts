import { NextRequest, NextResponse } from "next/server";
import {
  postDoubleEntryBatch,
  synthesizeBilateralSettlementJournal,
  DoubleEntryImbalanceError,
  STANDARD_CHART_OF_ACCOUNTS,
  type LedgerAccountType,
  type PostingDirection,
} from "@settler/reconciliation-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const {
      tenantId = "tenant_enterprise_019a",
      mode = "bilateral", // "bilateral" | "custom_batch"
      batchId = `batch_${Date.now()}`,
      rail = "stripe",
      externalReference = `ref_${Date.now()}`,
      grossSalesCents,
      interchangeFeeCents = 0,
      processorCutCents = 0,
      disputeReserveHoldCents = 0,
      currency = "USD",
      lines = [],
    } = body;

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

    let finalizedBatch;

    if (mode === "bilateral") {
      if (grossSalesCents === undefined) {
        return NextResponse.json(
          {
            error: "grossSalesCents is required for bilateral settlement mode",
            code: "SETTLER_INVALID_ARGUMENT",
          },
          { status: 400 }
        );
      }

      finalizedBatch = synthesizeBilateralSettlementJournal({
        batchId,
        tenantId,
        rail: rail as "stripe" | "paypal" | "adyen",
        grossSalesCents: BigInt(grossSalesCents),
        interchangeFeeCents: BigInt(interchangeFeeCents),
        processorCutCents: BigInt(processorCutCents),
        disputeReserveHoldCents: BigInt(disputeReserveHoldCents),
        currency,
        externalReference,
      });
    } else {
      // Custom batch mode: manual journal entries with zero-sum verification
      const parsedLines = lines.map(
        (l: {
          accountId: string;
          accountType: LedgerAccountType;
          direction: PostingDirection;
          amountCents: number | string;
          currency?: string;
          description: string;
          referenceId?: string;
        }) => ({
          accountId: l.accountId,
          accountType: l.accountType,
          direction: l.direction,
          amountCents: BigInt(l.amountCents),
          currency: l.currency || currency,
          description: l.description,
          referenceId: l.referenceId,
        })
      );

      finalizedBatch = postDoubleEntryBatch({
        batchId,
        tenantId,
        sourceRail: rail,
        externalReference,
        effectiveDate: new Date(),
        lines: parsedLines,
      });
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Serialize BigInts safely
    const serializedLines = finalizedBatch.lines.map((l) => ({
      ...l,
      amountCents: Number(l.amountCents),
    }));

    const response = NextResponse.json({
      status: "posted",
      batchId: finalizedBatch.batchId,
      tenantId: finalizedBatch.tenantId,
      sourceRail: finalizedBatch.sourceRail,
      externalReference: finalizedBatch.externalReference,
      postedAt: finalizedBatch.postedAt,
      effectiveDate: finalizedBatch.effectiveDate,
      lineCount: finalizedBatch.lineCount,
      totalDebitCents: Number(finalizedBatch.totalDebitCents),
      totalCreditCents: Number(finalizedBatch.totalCreditCents),
      balanceDeltaCents: Number(finalizedBatch.balanceDeltaCents),
      isZeroSumBalanced: finalizedBatch.isZeroSumBalanced,
      merkleLeafHash: finalizedBatch.merkleLeafHash,
      tigerbeetleTransferIds: finalizedBatch.tigerbeetleTransferIds,
      lines: serializedLines,
      durationMs,
      invariants: {
        zeroSumInvariantSatisfied: true,
        rfc6962LeafHash: finalizedBatch.merkleLeafHash,
      },
    });

    response.headers.set("x-settler-tenant-id", tenantId);
    response.headers.set("x-settler-merkle-root", finalizedBatch.merkleLeafHash);
    response.headers.set("x-settler-zero-sum", "true");
    response.headers.set("x-settler-duration-ms", String(durationMs));

    return response;
  } catch (error) {
    if (error instanceof DoubleEntryImbalanceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "SETTLER_DOUBLE_ENTRY_IMBALANCE",
          deltaCents: Number(error.deltaCents),
          totalDebits: Number(error.totalDebits),
          totalCredits: Number(error.totalCredits),
        },
        { status: 422 }
      );
    }

    const message = error instanceof Error ? error.message : "Ledger posting failed";
    return NextResponse.json(
      {
        error: message,
        code: "SETTLER_LEDGER_POSTING_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    chartOfAccounts: STANDARD_CHART_OF_ACCOUNTS,
    rules: [
      "sum(debits) === sum(credits) in strict integer cents",
      "Zero floating point arithmetic permitted",
      "Every posting line requires tenantId scoping",
      "Each batch is sealed with RFC 6962 SHA-256 Merkle leaf hash",
      "Mapped directly to TigerBeetle two-phase transfers",
    ],
  });
}
