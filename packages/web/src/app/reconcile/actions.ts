"use server";

import { prisma } from "@/shared/db/prismaClient";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant/server";

export async function acceptMatch(
  sourceTransactionId: string,
  targetTransactionId: string | null,
  sourceTxDto: Record<string, unknown>
) {
  try {
    const tenantContext = await getTenantContext();
    const tenantId = tenantContext.tenantId;
    if (!tenantId) {
      return {
        success: false,
        error: "SECURITY_INVARIANT_VIOLATION: Unauthenticated tenant action rejected.",
      };
    }

    const tenantAction = await getOrCreateTenantScope(tenantId, sourceTxDto);

    // Upsert or create the review record strictly scoped by tenantId
    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId,
        tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "resolved",
        resolutionReason: "accepted",
        notes: "Operator accepted canonical engine outcome.",
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to accept match", error);
    return { success: false, error: String(error) };
  }
}

export async function modifyMatch(
  sourceTransactionId: string,
  newTargetTransactionId: string | null,
  notes: string,
  sourceTxDto: Record<string, unknown>
) {
  try {
    const tenantContext = await getTenantContext();
    const tenantId = tenantContext.tenantId;
    if (!tenantId) {
      return {
        success: false,
        error: "SECURITY_INVARIANT_VIOLATION: Unauthenticated tenant action rejected.",
      };
    }

    const tenantAction = await getOrCreateTenantScope(tenantId, sourceTxDto);

    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId: newTargetTransactionId,
        tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "resolved",
        resolutionReason: "modified",
        notes: `Operator modified match destination. ${notes}`,
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to modify match", error);
    return { success: false, error: String(error) };
  }
}

export async function overrideMatch(
  sourceTransactionId: string,
  overrideReason: string,
  sourceTxDto: Record<string, unknown>
) {
  try {
    const tenantContext = await getTenantContext();
    const tenantId = tenantContext.tenantId;
    if (!tenantId) {
      return {
        success: false,
        error: "SECURITY_INVARIANT_VIOLATION: Unauthenticated tenant action rejected.",
      };
    }

    const tenantAction = await getOrCreateTenantScope(tenantId, sourceTxDto);

    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId: null, // Force unmatched or skipped
        tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "dismissed",
        resolutionReason: "override",
        notes: `Operator override: ${overrideReason}`,
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to override match", error);
    return { success: false, error: String(error) };
  }
}

export async function fetchReviewState(sourceTransactionId: string, explicitTenantId?: string) {
  try {
    const tenantContext = await getTenantContext();
    const tenantId = explicitTenantId || tenantContext.tenantId;
    if (!tenantId) {
      return null;
    }

    const review = await prisma.reconciliationMatch.findFirst({
      where: {
        tenantId,
        sourceTransactionId,
      },
      orderBy: { createdAt: "desc" },
    });
    return review;
  } catch (error) {
    console.error("Could not fetch review state", error);
    return null;
  }
}

// Scoped helper to ensure foreign key constraints are satisfied within the authenticated tenant
async function getOrCreateTenantScope(tenantId: string, sourceTxDto: Record<string, unknown>) {
  // Ensure source adapter / ingestion exists for this tenant
  let source = await prisma.ingestionSource.findFirst({ where: { tenantId } });
  if (!source) {
    const user = "00000000-0000-0000-0000-000000000000";
    source = await prisma.ingestionSource.create({
      data: { tenantId, userId: user, name: "Tenant Ingestion Source", type: "manual" },
    });
  }

  // Ensure ingestion exists for this tenant
  let ingestion = await prisma.ingestion.findFirst({ where: { tenantId, sourceId: source.id } });
  if (!ingestion) {
    const user = "00000000-0000-0000-0000-000000000000";
    ingestion = await prisma.ingestion.create({
      data: { sourceId: source.id, tenantId, userId: user, status: "completed" },
    });
  }

  const txId = typeof sourceTxDto.id === "string" ? sourceTxDto.id : undefined;

  // Upsert the specific NormalizedTransaction to satisfy the Foreign Key constraint if UUID is valid
  if (txId && txId.length === 36) {
    const existingNormTx = await prisma.normalizedTransaction.findFirst({
      where: { id: txId, tenantId },
    });

    if (!existingNormTx) {
      const amount = typeof sourceTxDto.amount === "number" ? Math.abs(sourceTxDto.amount) : 0;
      const currency = typeof sourceTxDto.currency === "string" ? sourceTxDto.currency : "USD";
      const timestamp =
        typeof sourceTxDto.timestamp === "string" || typeof sourceTxDto.timestamp === "number"
          ? new Date(sourceTxDto.timestamp)
          : new Date();
      const description =
        typeof sourceTxDto.description === "string"
          ? sourceTxDto.description
          : "Reconciliation transaction";

      await prisma.normalizedTransaction.create({
        data: {
          id: txId,
          tenantId,
          sourceId: source.id,
          ingestionId: ingestion.id,
          amount,
          currency,
          date: timestamp,
          description,
        },
      });
    }
  }

  // Find or create a recon run for this tenant
  let run = await prisma.reconciliationRun.findFirst({
    where: { tenantId },
  });

  if (!run) {
    const user = "00000000-0000-0000-0000-000000000000";
    run = await prisma.reconciliationRun.create({
      data: {
        tenantId,
        userId: user,
        name: "Operator Adjudication Scope",
        status: "completed",
      },
    });
  }

  return { tenantId, runId: run.id };
}
