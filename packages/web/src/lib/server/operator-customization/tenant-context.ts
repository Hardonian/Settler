import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";

/**
 * Resolve tenant for admin customization APIs.
 * Super-admins may pass ?tenantId=; otherwise default slug tenant is used.
 */
export async function resolveCustomizationTenantId(
  requestedTenantId: string | null
): Promise<{ ok: true; tenantId: string } | { ok: false; response: NextResponse }> {
  if (requestedTenantId) {
    const t = await prisma.tenant.findFirst({
      where: { id: requestedTenantId },
      select: { id: true },
    });
    if (!t) {
      return {
        ok: false,
        response: NextResponse.json({ error: "tenant_not_found" }, { status: 404 }),
      };
    }
    return { ok: true, tenantId: t.id };
  }

  const def = await prisma.tenant.findUnique({
    where: { slug: "default" },
    select: { id: true },
  });
  if (!def) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "default_tenant_missing", message: "No default tenant row (slug=default)." },
        { status: 503 }
      ),
    };
  }
  return { ok: true, tenantId: def.id };
}
