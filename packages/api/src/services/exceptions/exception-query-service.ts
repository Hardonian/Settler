import { prisma } from "../../infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "../../utils/typed-errors";

const CANONICAL_EXCEPTION_MATCH_TYPES = ["unmatched", "conflict"] as const;

export class ExceptionQueryService {
  async validateExceptionAccess(id: string, tenantId: string) {
    const exception = await prisma.reconciliationMatch.findFirst({
      where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
      select: { id: true, metadata: true, runId: true, status: true, assignedTo: true },
    });

    if (!exception) {
      throw new NotFoundError("Exception not found", "exception", id);
    }

    return exception;
  }

  async getExceptionById(id: string, tenantId: string) {
    const exception = await prisma.reconciliationMatch.findFirst({
      where: {
        id,
        tenantId,
        matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
      },
      include: {
        sourceTransaction: true,
        run: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
        archetypeClassifications: {
          include: { archetype: true },
          orderBy: { confidence: "desc" },
          take: 5,
        },
      },
    });

    if (!exception) {
      throw new NotFoundError("Exception not found", "exception", id);
    }

    return exception;
  }

  async listExceptions(
    tenantId: string,
    where: Prisma.ReconciliationMatchWhereInput,
    orderBy: any,
    limit: number,
    offset: number
  ) {
    const [exceptions, total] = await Promise.all([
      prisma.reconciliationMatch.findMany({
        where,
        include: {
          run: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
            },
          },
          sourceTransaction: true,
          targetTransaction: {
            select: {
              id: true,
              category: true,
              description: true,
              amount: true,
              currency: true,
              date: true,
            },
          },
          adjudicationMemories: true,
          archetypeClassifications: {
            include: { archetype: true },
            orderBy: { confidence: "desc" },
            take: 5,
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.reconciliationMatch.count({ where }),
    ]);

    return { exceptions, total };
  }

  async getExceptionStats(whereBase: Prisma.ReconciliationMatchWhereInput) {
    const [total, open, inProgress, resolved, dismissed, critical, high, medium, low, unassigned] =
      await Promise.all([
        prisma.reconciliationMatch.count({ where: whereBase }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "open" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "in_progress" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "resolved" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "dismissed" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "critical" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "high" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "medium" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "low" } }),
        prisma.reconciliationMatch.count({
          where: { ...whereBase, assignedTo: null, status: { notIn: ["resolved", "dismissed"] } },
        }),
      ]);

    return {
      total,
      byStatus: { open, inProgress, resolved, dismissed },
      bySeverity: { critical, high, medium, low },
      unassigned,
    };
  }

  async updateExceptionStatus(
    id: string,
    tenantId: string,
    status: string,
    userId: string,
    resolutionReason: string | undefined,
    notes: string | undefined,
    newMetadata: any
  ) {
    const updateResult = await prisma.reconciliationMatch.updateMany({
      where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
      data: {
        status,
        reviewed: status === "resolved" || status === "dismissed",
        reviewedBy: status === "resolved" || status === "dismissed" ? userId : undefined,
        reviewedAt: status === "resolved" || status === "dismissed" ? new Date() : undefined,
        resolutionReason: resolutionReason || undefined,
        notes: notes || undefined,
        metadata: newMetadata,
      },
    });
    return updateResult.count;
  }

  async addNote(id: string, tenantId: string, notes: string, newMetadata: any) {
    const updateResult = await prisma.reconciliationMatch.updateMany({
      where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
      data: {
        notes,
        metadata: newMetadata,
      },
    });
    return updateResult.count;
  }
}
