"use server";

import { prisma } from "@/shared/db/prismaClient";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant/server";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
} from "@/lib/supabase/tenant-membership";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAuthenticatedWorkbenchContext(): Promise<{ tenantId: string; userId: string }> {
  const [tenantContext, membershipScope] = await Promise.all([
    getTenantContext(),
    resolveTenantMembershipScope(),
  ]);

  return {
    tenantId: resolveTenantForMutation(membershipScope.tenantIds, tenantContext.tenantId || null),
    userId: membershipScope.userId,
  };
}

export async function acceptMatch(sourceTransactionId: string, targetTransactionId: string | null) {
  try {
    const { tenantId, userId } = await getAuthenticatedWorkbenchContext();
    const match = await requireScopedMatch(tenantId, sourceTransactionId);
    await requireScopedTarget(tenantId, targetTransactionId);

    const result = await prisma.reconciliationMatch.updateMany({
      where: { id: match.id, tenantId },
      data: {
        targetTransactionId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        reviewedBy: userId,
        status: "resolved",
        resolutionReason: "accepted",
        notes: "Operator accepted canonical engine outcome.",
        reviewedAt: new Date(),
      },
    });
    if (result.count !== 1) throw new Error("Scoped reconciliation match update failed");

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
  notes: string
) {
  try {
    const { tenantId, userId } = await getAuthenticatedWorkbenchContext();
    const match = await requireScopedMatch(tenantId, sourceTransactionId);
    await requireScopedTarget(tenantId, newTargetTransactionId);

    const result = await prisma.reconciliationMatch.updateMany({
      where: { id: match.id, tenantId },
      data: {
        targetTransactionId: newTargetTransactionId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        reviewedBy: userId,
        status: "resolved",
        resolutionReason: "modified",
        notes: `Operator modified match destination. ${notes.slice(0, 2_000)}`,
        reviewedAt: new Date(),
      },
    });
    if (result.count !== 1) throw new Error("Scoped reconciliation match update failed");

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to modify match", error);
    return { success: false, error: String(error) };
  }
}

export async function overrideMatch(sourceTransactionId: string, overrideReason: string) {
  try {
    const { tenantId, userId } = await getAuthenticatedWorkbenchContext();
    const match = await requireScopedMatch(tenantId, sourceTransactionId);

    const result = await prisma.reconciliationMatch.updateMany({
      where: { id: match.id, tenantId },
      data: {
        targetTransactionId: null,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        reviewedBy: userId,
        status: "dismissed",
        resolutionReason: "override",
        notes: `Operator override: ${overrideReason.slice(0, 2_000)}`,
        reviewedAt: new Date(),
      },
    });
    if (result.count !== 1) throw new Error("Scoped reconciliation match update failed");

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to override match", error);
    return { success: false, error: String(error) };
  }
}

export async function fetchReviewState(sourceTransactionId: string) {
  try {
    const { tenantId } = await getAuthenticatedWorkbenchContext();

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

async function requireScopedMatch(tenantId: string, sourceTransactionId: string) {
  if (!UUID_PATTERN.test(sourceTransactionId)) throw new Error("Invalid source transaction ID");
  const match = await prisma.reconciliationMatch.findFirst({
    where: { tenantId, sourceTransactionId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!match) throw new Error("Reconciliation match not found");
  return match;
}

async function requireScopedTarget(tenantId: string, targetTransactionId: string | null) {
  if (targetTransactionId === null) return;
  if (!UUID_PATTERN.test(targetTransactionId)) throw new Error("Invalid target transaction ID");
  const target = await prisma.normalizedTransaction.findFirst({
    where: { id: targetTransactionId, tenantId },
    select: { id: true },
  });
  if (!target) throw new Error("Target transaction not found");
}
