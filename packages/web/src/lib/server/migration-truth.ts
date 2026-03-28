/**
 * Runtime truth for DB migrations the webhook + API layers depend on.
 * Fail-closed: if we cannot query the catalog, callers must not assume tenant-scoped webhook_configs.
 */

import type { PrismaClient } from "@prisma/client";

export type WebhookConfigsScopingIssue =
  | "WEBHOOK_CONFIGS_MIGRATION_MISSING"
  | "WEBHOOK_CONFIGS_TENANT_PARTIAL"
  | "WEBHOOK_CONFIGS_UNIQUE_CONSTRAINT_MISSING"
  | "WEBHOOK_CONFIGS_SCHEMA_CHECK_FAILED";

export type WebhookConfigsTenantScopingResult =
  | { ok: true }
  | { ok: false; code: WebhookConfigsScopingIssue; message: string };

type PrismaWithOptionalInit = PrismaClient & { __prismaInitError?: unknown };

function isLivePrisma(client: PrismaClient): boolean {
  return !("__prismaInitError" in client && (client as PrismaWithOptionalInit).__prismaInitError);
}

/**
 * Verifies public.webhook_configs has tenant_id NOT NULL and composite uniqueness (migration 20260328000000).
 * Safe to call from route handlers when DATABASE_URL / Prisma are configured.
 */
export async function assertWebhookConfigsTenantScoping(
  prisma: PrismaClient
): Promise<WebhookConfigsTenantScopingResult> {
  if (!isLivePrisma(prisma)) {
    return {
      ok: false,
      code: "WEBHOOK_CONFIGS_SCHEMA_CHECK_FAILED",
      message: "Database client is not initialized; cannot verify webhook_configs tenant migration",
    };
  }

  try {
    const tenantCol = (await prisma.$queryRaw`
      SELECT c.is_nullable::text AS is_nullable
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'webhook_configs'
        AND c.column_name = 'tenant_id'
    `) as Array<{ is_nullable: string }>;

    if (!tenantCol.length) {
      return {
        ok: false,
        code: "WEBHOOK_CONFIGS_MIGRATION_MISSING",
        message:
          "webhook_configs.tenant_id is missing; apply migration 20260328000000_webhook_configs_tenant_scoped.sql before using tenant-scoped webhook secrets",
      };
    }

    if (tenantCol[0]?.is_nullable === "YES") {
      return {
        ok: false,
        code: "WEBHOOK_CONFIGS_TENANT_PARTIAL",
        message:
          "webhook_configs.tenant_id is still nullable; tenant-scoped webhook secret support is only partially applied",
      };
    }

    const uniq = (await prisma.$queryRaw`
      SELECT 1 AS oid
      FROM pg_constraint
      WHERE conname = 'webhook_configs_tenant_id_adapter_key'
        AND conrelid = 'public.webhook_configs'::regclass
    `) as Array<{ oid: unknown }>;

    if (!uniq.length) {
      return {
        ok: false,
        code: "WEBHOOK_CONFIGS_UNIQUE_CONSTRAINT_MISSING",
        message:
          "webhook_configs composite unique (tenant_id, adapter) is missing; apply tenant-scoped webhook_configs migration",
      };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      code: "WEBHOOK_CONFIGS_SCHEMA_CHECK_FAILED",
      message: `Could not verify webhook_configs schema: ${msg}`,
    };
  }
}
