"use server";

import { prisma } from "@/shared/db/prismaClient";
import { revalidatePath } from "next/cache";

export async function acceptMatch(sourceTransactionId: string, targetTransactionId: string | null, sourceTxDto: any) {
  try {
    const tenantAction = await getOrCreateTenant(sourceTxDto);
    
    // Upsert or create the review record. 
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
    revalidatePath(\`/reconcile/\${sourceTransactionId}\`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to accept match", error);
    return { success: false, error: String(error) };
  }
}

export async function modifyMatch(sourceTransactionId: string, newTargetTransactionId: string | null, notes: string, sourceTxDto: any) {
  try {
    const tenantAction = await getOrCreateTenant(sourceTxDto);
    
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
    revalidatePath(\`/reconcile/\${sourceTransactionId}\`);
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Failed to modify match", error);
    return { success: false, error: String(error) };
  }
}

export async function overrideMatch(sourceTransactionId: string, overrideReason: string, sourceTxDto: any) {
  try {
    const tenantAction = await getOrCreateTenant(sourceTxDto);
    
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
    revalidatePath(\`/reconcile/\${sourceTransactionId}\`);
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
async function getOrCreateTenant(sourceTxDto: any) {
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "System Tenant", slug: "system", isActive: true }
    });
  }

  // Ensure source adapter / ingestion exists
  let source = await prisma.ingestionSource.findFirst({ where: { tenantId: tenant.id } });
  if (!source) {
    const user = "00000000-0000-0000-0000-000000000000";
    source = await prisma.ingestionSource.create({
      data: { tenantId: tenant.id, userId: user, name: "Demo Import", type: "manual" }
    });
  }

  // Ensure ingestion
  let ingestion = await prisma.ingestion.findFirst({ where: { sourceId: source.id } });
  if (!ingestion) {
    const user = "00000000-0000-0000-0000-000000000000";
    ingestion = await prisma.ingestion.create({
      data: { sourceId: source.id, tenantId: tenant.id, userId: user, status: "completed" }
    });
  }

  // Upsert the specific NormalizedTransaction to satisfy the Foreign Key constraint
  let normTx = await prisma.normalizedTransaction.findUnique({
    where: { id: sourceTxDto.id }
  });
  
  if (!normTx && sourceTxDto.id.length === 36) { // Ensure validity as UUID, fallback if fake UUIDs are used in loaders
    normTx = await prisma.normalizedTransaction.create({
      data: {
        id: sourceTxDto.id,
        tenantId: tenant.id,
        sourceId: source.id,
        ingestionId: ingestion.id,
        amount: Math.abs(sourceTxDto.amount),
        currency: sourceTxDto.currency || "USD",
        date: new Date(sourceTxDto.timestamp),
        description: sourceTxDto.description || "Demo fallback transaction"
      }
    });
  }

  // Create a dummy recon run for the demo tracking
  let run = await prisma.reconciliationRun.findFirst({
    where: { tenantId: tenant.id }
  });
  
  if (!run) {
    const user = "00000000-0000-0000-0000-000000000000";
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
       throw e;
    }
  }

  return { tenantId: tenant.id, runId: run.id };
}
