/**
 * Console Site Builder - Runtime UI Config API
 *
 * GET /api/console/site/ui-config
 * PUT /api/console/site/ui-config
 *
 * Storage:
 * - Prisma Tenant.metadata.uiConfig (global)
 * - Prisma Tenant.metadata.uiConfigByEnv[env] (env-specific override)
 *
 * Security:
 * - Requires authenticated session
 * - Requires UPDATE_TENANT_UI_CONFIG permission
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";
import { safeParsePublicRuntimeUiConfig, PublicRuntimeUiConfigSchema } from "@/lib/runtime-ui-config/schema";
import { getRuntimeEnvKey, resolvePublicRuntimeUiConfig } from "@/lib/runtime-ui-config/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PutSchema = z.object({
  environment: z.string().min(1).max(40).optional(),
  scope: z.enum(["env", "global"]).default("env"),
  config: PublicRuntimeUiConfigSchema,
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json(
          {
            environment: getRuntimeEnvKey(),
            scope: "env",
            stored: null,
            resolved: safeParsePublicRuntimeUiConfig({}),
          },
          { status: 200 }
        );
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_TENANT_CONFIG, tenantId);

      const { searchParams } = new URL(request.url);
      const environment = searchParams.get("environment") || getRuntimeEnvKey();

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, metadata: true, branding: { select: { borderRadiusScale: true } } },
      });

      const metadata = (tenant?.metadata ?? {}) as unknown;
      const storedEnv =
        isPlainObject(metadata) && isPlainObject(metadata.uiConfigByEnv)
          ? (metadata.uiConfigByEnv as Record<string, unknown>)[environment] ?? null
          : null;

      const storedGlobal = isPlainObject(metadata) ? (metadata.uiConfig ?? null) : null;

      const resolved = resolvePublicRuntimeUiConfig({
        tenantMetadata: metadata,
        tenantBranding: tenant?.branding
          ? { borderRadiusScale: tenant.branding.borderRadiusScale ? Number(tenant.branding.borderRadiusScale) : null }
          : null,
      });

      return NextResponse.json(
        {
          environment,
          stored: {
            global: storedGlobal,
            env: storedEnv,
          },
          resolved,
        },
        { status: 200 }
      );
    } catch (error) {
      return handleApiError(error, "Failed to load UI config");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

export const PUT = withSecurity(
  async function PUT(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ success: false, error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.UPDATE_TENANT_UI_CONFIG, tenantId);

      const body = PutSchema.parse(await request.json());
      const environment = body.environment || getRuntimeEnvKey();
      const sanitized = safeParsePublicRuntimeUiConfig(body.config);

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, metadata: true },
      });
      const existing = (tenant?.metadata ?? {}) as unknown;
      const nextMetadata: Record<string, unknown> = isPlainObject(existing) ? { ...existing } : {};

      if (body.scope === "global") {
        nextMetadata.uiConfig = sanitized;
      } else {
        const byEnv: Record<string, unknown> = isPlainObject(nextMetadata.uiConfigByEnv)
          ? { ...(nextMetadata.uiConfigByEnv as Record<string, unknown>) }
          : {};
        byEnv[environment] = sanitized;
        nextMetadata.uiConfigByEnv = byEnv;
      }

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { metadata: JSON.parse(JSON.stringify(nextMetadata)) as Prisma.InputJsonValue },
      });

      return NextResponse.json({ success: true, environment, scope: body.scope, config: sanitized }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
      }
      return handleApiError(error, "Failed to update UI config");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);

