/**
 * Exception Lifecycle Event Helpers
 *
 * Emits lifecycle events when reconciliation exceptions are created or resolved.
 * This is called from reconciliation processing logic.
 */

import { emitLifecycleEventSafe, LifecycleEventType } from "./lifecycle-events";
import { prisma } from "@/shared/db/prismaClient";

/**
 * Emit exception created event when unmatched reconciliation match is created
 */
export async function emitExceptionCreatedEvent(params: {
  reconciliationMatchId: string;
  tenantId: string;
  userId?: string;
  runId?: string;
}): Promise<void> {
  try {
    const match = await prisma.reconciliationMatch.findUnique({
      where: { id: params.reconciliationMatchId },
      include: {
        run: {
          include: {
            ingestion: {
              include: {
                source: {
                  select: { tenantId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!match || match.matchType === "matched") {
      return; // Only emit for unmatched/conflict matches
    }

    const matchTenantId: string = match.tenantId ?? "";
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        tenant: {
          id: matchTenantId,
        },
      },
      select: { id: true, userId: true },
    });

    const userId = params.userId || billingAccount?.userId;
    await emitLifecycleEventSafe(LifecycleEventType.RECON_EXCEPTION_CREATED, {
      userId,
      tenantId: matchTenantId,
      billingAccountId: billingAccount?.id,
      properties: {
        match_id: params.reconciliationMatchId,
        match_type: match.matchType,
        run_id: params.runId || match.runId,
        confidence: Number(match.confidence),
      },
    } as any);
  } catch (error) {
    // Don't throw - event tracking should never break the main flow
    console.error("Failed to emit exception created event:", error);
  }
}

/**
 * Emit exception resolved event when reconciliation match is reviewed/resolved
 */
export async function emitExceptionResolvedEvent(params: {
  reconciliationMatchId: string;
  tenantId: string;
  userId: string;
  reviewed: boolean;
}): Promise<void> {
  try {
    if (!params.reviewed) {
      return; // Only emit when exception is actually resolved
    }

    const match = await prisma.reconciliationMatch.findUnique({
      where: { id: params.reconciliationMatchId },
    });

    if (!match || match.matchType === "matched") {
      return; // Only emit for previously unmatched/conflict matches
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        tenant: {
          id: params.tenantId,
        },
      },
      select: { id: true },
    });

    await emitLifecycleEventSafe(LifecycleEventType.RECON_EXCEPTION_RESOLVED, {
      userId: params.userId,
      tenantId: params.tenantId,
      billingAccountId: billingAccount?.id,
      properties: {
        match_id: params.reconciliationMatchId,
        match_type: match.matchType,
        reviewed_at: match.reviewedAt?.toISOString(),
      },
    } as any);
  } catch (error) {
    // Don't throw - event tracking should never break the main flow
    console.error("Failed to emit exception resolved event:", error);
  }
}
