/**
 * Canonical support query service — reads support submissions from AuditLog.
 * Owned by @settler/types support contract.
 */

import { prisma } from "@/shared/db/prismaClient";
import type { SupportSubmissionRecord, SupportStatus, SupportSeverity } from "@settler/types";

interface SupportQueryFilters {
  tenantId?: string;
  status?: SupportStatus;
  category?: string;
  limit?: number;
}

interface AuditLogRow {
  id: string;
  userId: string | null;
  tenantId: string | null;
  metadata: unknown;
  createdAt: Date;
}

function extractMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export async function querySupportSubmissions(
  filters: SupportQueryFilters
): Promise<SupportSubmissionRecord[]> {
  const where: Record<string, unknown> = {
    action: "support_intake_submitted",
    resourceType: "support",
  };

  if (filters.tenantId) {
    where.tenantId = filters.tenantId;
  }

  const rows = (await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.limit ?? 100, 500),
  })) as AuditLogRow[];

  return rows
    .map((row) => {
      const meta = extractMetadata(row.metadata);
      const record: SupportSubmissionRecord = {
        submissionId: (meta.submission_id as string) ?? row.id,
        tenantId: (row.tenantId as string) ?? "",
        userId: row.userId,
        category: (meta.category as SupportSubmissionRecord["category"]) ?? "docs_other",
        severity: (meta.severity as SupportSeverity) ?? "medium",
        status: (meta.status as SupportStatus) ?? "open",
        description: (meta.description as string) ?? "",
        runId: (meta.run_id as string) ?? null,
        route: (meta.route as string) ?? null,
        module: (meta.module as string) ?? null,
        contact: (meta.contact as SupportSubmissionRecord["contact"]) ?? null,
        runContextState:
          meta.run_context &&
          typeof meta.run_context === "object" &&
          "state" in (meta.run_context as Record<string, unknown>)
            ? ((meta.run_context as Record<string, string>).state ?? null)
            : null,
        operatorNotes: (meta.operator_notes as string) ?? null,
        createdAt: row.createdAt.toISOString(),
      };
      return record;
    })
    .filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.category && r.category !== filters.category) return false;
      return true;
    });
}

export async function updateSupportSubmissionStatus(
  submissionId: string,
  update: { status?: SupportStatus; severity?: SupportSeverity; operatorNotes?: string }
): Promise<boolean> {
  const rows = (await prisma.auditLog.findMany({
    where: {
      action: "support_intake_submitted",
      resourceType: "support",
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  })) as AuditLogRow[];

  const target = rows.find((row) => {
    const meta = extractMetadata(row.metadata);
    return meta.submission_id === submissionId;
  });

  if (!target) return false;

  const meta = extractMetadata(target.metadata);
  const updatedMeta = {
    ...meta,
    ...(update.status !== undefined ? { status: update.status } : {}),
    ...(update.severity !== undefined ? { severity: update.severity } : {}),
    ...(update.operatorNotes !== undefined ? { operator_notes: update.operatorNotes } : {}),
  };

  await prisma.auditLog.update({
    where: { id: target.id },
    data: { metadata: updatedMeta },
  });

  return true;
}
