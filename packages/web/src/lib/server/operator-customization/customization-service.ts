import type { Prisma, PrismaClient } from "@prisma/client";
import type { CustomizationPatch, OperatorSurfaceId } from "@/lib/operator-customization/schema";
import {
  applyCustomizationPatch,
  ensureCustomizationShape,
  normalizeOperatorCustomization,
} from "@/lib/operator-customization/normalize";
import { defaultAdminDashboardCustomization } from "@/lib/operator-customization/registry";
import type { OperatorSurfaceCustomization } from "@/lib/operator-customization/schema";

const SURFACE: OperatorSurfaceId = "admin_dashboard";

export async function getCustomizationState(
  prisma: PrismaClient,
  tenantId: string,
  userId: string
): Promise<{
  surface: OperatorSurfaceId;
  draft: OperatorSurfaceCustomization;
  published: OperatorSurfaceCustomization;
  publishedAt: string | null;
  draftUpdatedAt: string;
}> {
  const row = await prisma.operatorCustomizationState.findUnique({
    where: {
      tenantId_userId_surface: { tenantId, userId, surface: SURFACE },
    },
  });

  const published = ensureCustomizationShape(row?.publishedConfig);
  const draft = ensureCustomizationShape(row?.draftConfig ?? row?.publishedConfig);

  return {
    surface: SURFACE,
    draft,
    published,
    publishedAt: row?.publishedAt?.toISOString() ?? null,
    draftUpdatedAt: row?.draftUpdatedAt.toISOString() ?? new Date().toISOString(),
  };
}

export async function saveDraft(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  config: OperatorSurfaceCustomization
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const n = normalizeOperatorCustomization(config);
  if (!n.ok) return n;

  await prisma.operatorCustomizationState.upsert({
    where: { tenantId_userId_surface: { tenantId, userId, surface: SURFACE } },
    create: {
      tenantId,
      userId,
      surface: SURFACE,
      schemaVersion: n.value.schemaVersion,
      draftConfig: n.value as unknown as Prisma.InputJsonValue,
      publishedConfig: defaultAdminDashboardCustomization() as unknown as Prisma.InputJsonValue,
      draftUpdatedAt: new Date(),
    },
    update: {
      schemaVersion: n.value.schemaVersion,
      draftConfig: n.value as unknown as Prisma.InputJsonValue,
      draftUpdatedAt: new Date(),
    },
  });

  return { ok: true };
}

export async function publishDraft(
  prisma: PrismaClient,
  tenantId: string,
  userId: string
): Promise<{ ok: true; published: OperatorSurfaceCustomization } | { ok: false; errors: string[] }> {
  const row = await prisma.operatorCustomizationState.findUnique({
    where: { tenantId_userId_surface: { tenantId, userId, surface: SURFACE } },
  });
  const draft = ensureCustomizationShape(row?.draftConfig);
  const n = normalizeOperatorCustomization(draft);
  if (!n.ok) return n;

  await prisma.operatorCustomizationState.upsert({
    where: { tenantId_userId_surface: { tenantId, userId, surface: SURFACE } },
    create: {
      tenantId,
      userId,
      surface: SURFACE,
      schemaVersion: n.value.schemaVersion,
      draftConfig: n.value as unknown as Prisma.InputJsonValue,
      publishedConfig: n.value as unknown as Prisma.InputJsonValue,
      publishedAt: new Date(),
      draftUpdatedAt: new Date(),
    },
    update: {
      publishedConfig: n.value as unknown as Prisma.InputJsonValue,
      publishedAt: new Date(),
      schemaVersion: n.value.schemaVersion,
    },
  });

  return { ok: true, published: n.value };
}

export async function revertPublishedToDraft(
  prisma: PrismaClient,
  tenantId: string,
  userId: string
): Promise<{ ok: true; draft: OperatorSurfaceCustomization } | { ok: false; errors: string[] }> {
  const row = await prisma.operatorCustomizationState.findUnique({
    where: { tenantId_userId_surface: { tenantId, userId, surface: SURFACE } },
  });
  if (!row) {
    return { ok: false, errors: ["No saved customization state."] };
  }
  const published = ensureCustomizationShape(row.publishedConfig);
  const n = normalizeOperatorCustomization(published);
  if (!n.ok) return n;

  await prisma.operatorCustomizationState.update({
    where: { tenantId_userId_surface: { tenantId, userId, surface: SURFACE } },
    data: {
      draftConfig: n.value as unknown as Prisma.InputJsonValue,
      draftUpdatedAt: new Date(),
    },
  });

  return { ok: true, draft: n.value };
}

export async function applyPatchToDraft(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  patch: CustomizationPatch
): Promise<{ ok: true; draft: OperatorSurfaceCustomization } | { ok: false; errors: string[] }> {
  const current = await getCustomizationState(prisma, tenantId, userId);
  const merged = applyCustomizationPatch(current.draft, patch);
  if (!merged.ok) return merged;
  const saved = await saveDraft(prisma, tenantId, userId, merged.value);
  if (!saved.ok) return saved;
  return { ok: true, draft: merged.value };
}

export async function recordCustomizationAudit(
  prisma: PrismaClient,
  tenantId: string,
  userId: string | null,
  action: string,
  surface: string | null,
  details: Record<string, unknown>
): Promise<void> {
  await prisma.operatorCustomizationAudit.create({
    data: {
      tenantId,
      userId,
      action,
      surface,
      details: details as Prisma.InputJsonValue,
    },
  });
}
