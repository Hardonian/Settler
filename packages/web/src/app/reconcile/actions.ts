"use server";

import { prisma } from "@/shared/db/prismaClient";
import { revalidatePath } from "next/cache";

export async function acceptMatch(sourceTransactionId: string, targetTransactionId: string | null) {
  try {
    // Upsert or create the review record. Since `id` is a UUID, we can't upsert directly without an active Run.
    // For the sake of the canonical path + demo fallback, we will create a new Run & Match if one does not exist.
    // We expect a tenantId in a real app, we'll hardcode a dummy or grab the first for now to ensure DB rules are met.
    const tenantAction = await getOrCreateTenant();
    
    // Create an explicit audit log / match record for the Accepted state
    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId,
        tenantId: tenantAction.tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "resolved",
        resolutionReason: "accepted",
        notes: "Operator accepted canonical engine outcome.",
        reviewedAt: new Date(),
      }
    });

    revalidatePath("/reconcile");
    revalidatePath(`/reconcile/${sourceTransactionId}`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to accept match", error);
    return { success: false, error: String(error) };
  }
}

export async function modifyMatch(sourceTransactionId: string, newTargetTransactionId: string | null, notes: string) {
  try {
    const tenantAction = await getOrCreateTenant();
    
    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId: newTargetTransactionId,
        tenantId: tenantAction.tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "resolved",
        resolutionReason: "modified",
        notes: \`Operator modified match destination. \${notes}\`,
        reviewedAt: new Date(),
      }
    });

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
    const tenantAction = await getOrCreateTenant();
    
    const match = await prisma.reconciliationMatch.create({
      data: {
        runId: tenantAction.runId,
        sourceTransactionId,
        targetTransactionId: null, // Force unmatched or skipped
        tenantId: tenantAction.tenantId,
        matchType: "manual",
        confidence: 1.0,
        reviewed: true,
        status: "dismissed",
        resolutionReason: "override",
        notes: \`Operator override: \${overrideReason}\`,
        reviewedAt: new Date(),
      }
    });

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
    const review = await prisma.reconciliationMatch.findFirst({
      where: { sourceTransactionId },
      orderBy: { createdAt: 'desc' },
    });
    return review;
  } catch (error) {
    console.error("Could not fetch review state", error);
    return null;
  }
}

// Fallback helper to ensure we satisfy Foreign Key constraints for demo local
async function getOrCreateTenant() {
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "System Tenant", slug: "system", isActive: true }
    });
  }

  // Create a dummy recon run for the demo tracking
  let run = await prisma.reconciliationRun.findFirst({
    where: { tenantId: tenant.id }
  });
  
  if (!run) {
    // Need a dummy user too
    let user = "00000000-0000-0000-0000-000000000000";
    
    // We'll wrap this in a catch if PG fails to use UUID zeroes.
    try {
      run = await prisma.reconciliationRun.create({
        data: {
          tenantId: tenant.id,
          userId: user,
          name: "Demo Review Scope",
          status: "completed"
        }
      });
    } catch (e) {
       // if zero uuid fails, we'll try something else or bypass.
       throw e;
    }
  }

  return { tenantId: tenant.id, runId: run.id };
}
