/**
 * Public Runtime UI Config API
 *
 * GET /api/public/ui-config
 *
 * - Read-only
 * - Safe for unauthenticated access (returns only public UI config)
 * - Gracefully falls back to safe defaults if tenant/config is missing
 * - Light caching for fast iteration during polish
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveTenant, getTenantById } from "@/shared/tenant/tenantResolver";
import { resolvePublicRuntimeUiConfig } from "@/lib/runtime-ui-config/server";
import { getRuntimeEnvKey } from "@/lib/runtime-ui-config/server";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const resolution = await resolveTenant(request);
      const tenant = resolution.tenantId ? await getTenantById(resolution.tenantId) : null;

      const config = resolvePublicRuntimeUiConfig({
        tenantMetadata: tenant?.metadata ?? undefined,
        tenantBranding: tenant?.branding
          ? { borderRadiusScale: tenant.branding.borderRadiusScale ? Number(tenant.branding.borderRadiusScale) : null }
          : null,
      });

      const res = NextResponse.json(
        {
          environment: getRuntimeEnvKey(),
          tenantId: resolution.tenantId || null,
          tenantSlug: resolution.tenantSlug || "default",
          config,
        },
        { status: 200 }
      );

      // Light caching at the edge/CDN; keep iteration fast while reducing load.
      res.headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
      res.headers.set("Vary", "Host");
      return res;
    } catch (error) {
      // Never 500 for public config; return safe default.
      const res = NextResponse.json(
        {
          environment: getRuntimeEnvKey(),
          tenantId: null,
          tenantSlug: "default",
          config: resolvePublicRuntimeUiConfig({}),
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=120");
      res.headers.set("Vary", "Host");
      return res;
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 120 }, requireAuth: false }
);

