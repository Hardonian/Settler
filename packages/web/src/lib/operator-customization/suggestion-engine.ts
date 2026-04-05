/**
 * Deterministic suggestions from recorded interaction signals (tenant-scoped).
 * Evidence = counts and windows; no hidden mutation.
 */

import type { PrismaClient } from "@prisma/client";

export type ModuleVisitSuggestion = {
  kind: "pin_module";
  moduleId: string;
  evidence: { visitsInWindow: number; windowHours: number };
  message: string;
};

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_VISITS = 8;
const MAX_SUGGESTIONS = 3;

export async function computeModuleVisitSuggestions(
  prisma: PrismaClient,
  tenantId: string,
  userId: string | null
): Promise<ModuleVisitSuggestion[]> {
  const since = new Date(Date.now() - WINDOW_MS);

  const where = {
    tenantId,
    signalType: "module_view",
    createdAt: { gte: since },
    ...(userId ? { userId } : {}),
  };

  const rows = await prisma.operatorInteractionSignal.groupBy({
    by: ["moduleId"],
    where,
    _count: { moduleId: true },
  });

  type Row = (typeof rows)[number];

  const sorted = rows
    .filter((r: Row) => r._count.moduleId >= MIN_VISITS)
    .sort((a: Row, b: Row) => b._count.moduleId - a._count.moduleId)
    .slice(0, MAX_SUGGESTIONS);

  return sorted.map((r: Row) => ({
    kind: "pin_module" as const,
    moduleId: r.moduleId,
    evidence: { visitsInWindow: r._count.moduleId, windowHours: 168 },
    message: `You opened “${r.moduleId}” ${r._count.moduleId} times in the last 7 days — consider keeping it high in your layout.`,
  }));
}
