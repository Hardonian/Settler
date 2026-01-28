/**
 * Console Site Builder - Navigation API
 *
 * GET /api/console/site/navigation  - Fetch tenant navigation
 * PUT /api/console/site/navigation  - Update tenant navigation
 *
 * Security:
 * - Requires authenticated session
 * - Enforces tenant-scoped permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NavItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(500),
    type: z.enum(["internal", "external"]),
    iconKey: z.string().max(80).optional(),
    children: z.array(NavItemSchema).optional(),
  })
);

const NavigationUpdateSchema = z.object({
  navItems: z.array(NavItemSchema).default([]),
  footerItems: z.array(NavItemSchema).default([]),
});

function defaultNavigation() {
  return {
    navItems: [] as any[],
    footerItems: [] as any[],
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ navigation: defaultNavigation() }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_TENANT_CONFIG, tenantId);

      const navigation = await prisma.tenantNavigation.findUnique({
        where: { tenantId },
      });

      return NextResponse.json(
        {
          navigation: navigation
            ? {
                navItems: (navigation.navItems as any[]) ?? [],
                footerItems: (navigation.footerItems as any[]) ?? [],
              }
            : defaultNavigation(),
        },
        { status: 200 }
      );
    } catch (error) {
      return handleApiError(error, "Failed to fetch navigation");
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
        return NextResponse.json({ error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.UPDATE_TENANT_NAVIGATION, tenantId);

      const body = NavigationUpdateSchema.parse(await request.json());

      const navigation = await prisma.tenantNavigation.upsert({
        where: { tenantId },
        create: {
          tenantId,
          navItems: body.navItems,
          footerItems: body.footerItems,
        },
        update: {
          navItems: body.navItems,
          footerItems: body.footerItems,
        },
      });

      return NextResponse.json(
        {
          navigation: {
            navItems: (navigation.navItems as any[]) ?? [],
            footerItems: (navigation.footerItems as any[]) ?? [],
          },
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
      }
      return handleApiError(error, "Failed to update navigation");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);

