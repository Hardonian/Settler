import { NextResponse } from "next/server";
import {
  customizationSchemaNotReadyResponse,
  isOperatorCustomizationSchemaMissingError,
} from "./operator-customization-errors";
import { prisma } from "@/shared/db/prismaClient";

export type ResolvedCustomizationTenant = {
  tenantId: string;
  tenantSlug: string;
  /** True when more than one active tenant exists; UI should show explicit context. */
  multiTenantEnvironment: boolean;
};

/**
 * Resolve tenant for admin customization APIs.
 * - With `tenantId`: must exist (UUID).
 * - Without `tenantId`: allowed only when exactly one active tenant exists (solo-operator ergonomics).
 * - Multiple active tenants: require explicit `tenantId` (fail closed on ambiguity).
 */
export async function resolveCustomizationTenantId(
  requestedTenantId: string | null
): Promise<
  { ok: true; tenant: ResolvedCustomizationTenant } | { ok: false; response: NextResponse }
> {
  if (requestedTenantId) {
    try {
      const t = await prisma.tenant.findFirst({
        where: { id: requestedTenantId, isActive: true },
        select: { id: true, slug: true },
      });
      if (!t) {
        return {
          ok: false,
          response: NextResponse.json({ error: "tenant_not_found" }, { status: 404 }),
        };
      }
      const count = await prisma.tenant.count({ where: { isActive: true } });
      return {
        ok: true,
        tenant: {
          tenantId: t.id,
          tenantSlug: t.slug,
          multiTenantEnvironment: count > 1,
        },
      };
    } catch (e) {
      if (isOperatorCustomizationSchemaMissingError(e)) {
        return { ok: false, response: customizationSchemaNotReadyResponse() };
      }
      throw e;
    }
  }

  try {
    const activeCount = await prisma.tenant.count({ where: { isActive: true } });
    if (activeCount === 0) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "no_active_tenant", message: "No active tenant rows in database." },
          { status: 503 }
        ),
      };
    }
    if (activeCount > 1) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "tenant_selection_required",
            code: "ambiguous_tenant",
            message:
              "Multiple active tenants exist. Pass tenantId (query or body) to target exactly one workspace.",
            activeTenantCount: activeCount,
          },
          { status: 400 }
        ),
      };
    }

    const only = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true, slug: true },
    });
    if (!only) {
      return {
        ok: false,
        response: NextResponse.json({ error: "tenant_resolve_failed" }, { status: 503 }),
      };
    }

    return {
      ok: true,
      tenant: {
        tenantId: only.id,
        tenantSlug: only.slug,
        multiTenantEnvironment: false,
      },
    };
  } catch (e) {
    if (isOperatorCustomizationSchemaMissingError(e)) {
      return { ok: false, response: customizationSchemaNotReadyResponse() };
    }
    throw e;
  }
}

export async function listActiveTenantsForPicker(): Promise<
  Array<{ id: string; slug: string; name: string }>
> {
  return prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { slug: "asc" },
  });
}
