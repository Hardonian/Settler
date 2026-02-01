/**
 * Console Site Builder - Branding API
 *
 * GET  /api/console/site/branding  - Fetch tenant branding
 * PUT  /api/console/site/branding  - Update tenant branding
 *
 * Security:
 * - Requires authenticated session
 * - Enforces tenant-scoped permissions
 * - Never exposes secrets
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

const HexColor = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color");

const BrandingUpdateSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: HexColor,
  secondaryColor: HexColor,
  accentColor: HexColor,
  backgroundColor: HexColor,
  borderRadiusScale: z.number().min(0.5).max(2).nullable().optional(),
  fontFamilyPrimary: z.string().max(200).nullable().optional(),
  fontFamilySecondary: z.string().max(200).nullable().optional(),
});

function defaultBranding() {
  return {
    logoUrl: null as string | null,
    faviconUrl: null as string | null,
    primaryColor: "#2563eb",
    secondaryColor: "#7c3aed",
    accentColor: "#06b6d4",
    backgroundColor: "#ffffff",
    borderRadiusScale: 1.0 as number,
    fontFamilyPrimary: null as string | null,
    fontFamilySecondary: null as string | null,
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ branding: defaultBranding() }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_TENANT_CONFIG, tenantId);

      const branding = await prisma.tenantBranding.findUnique({
        where: { tenantId },
      });

      return NextResponse.json(
        {
          branding: branding
            ? {
                logoUrl: branding.logoUrl ?? null,
                faviconUrl: branding.faviconUrl ?? null,
                primaryColor: branding.primaryColor,
                secondaryColor: branding.secondaryColor,
                accentColor: branding.accentColor,
                backgroundColor: branding.backgroundColor,
                borderRadiusScale: branding.borderRadiusScale ? Number(branding.borderRadiusScale) : 1.0,
                fontFamilyPrimary: branding.fontFamilyPrimary ?? null,
                fontFamilySecondary: branding.fontFamilySecondary ?? null,
              }
            : defaultBranding(),
        },
        { status: 200 }
      );
    } catch (_error) {
      return handleApiError(error, "Failed to fetch branding");
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

      await requirePermission(auth.userId, SiteBuilderPermission.UPDATE_TENANT_BRANDING, tenantId);

      const body = BrandingUpdateSchema.parse(await request.json());

      const branding = await prisma.tenantBranding.upsert({
        where: { tenantId },
        create: {
          tenantId,
          ...body,
          borderRadiusScale: body.borderRadiusScale ?? 1.0,
        },
        update: {
          ...body,
          borderRadiusScale: body.borderRadiusScale ?? 1.0,
        },
      });

      return NextResponse.json(
        {
          branding: {
            logoUrl: branding.logoUrl ?? null,
            faviconUrl: branding.faviconUrl ?? null,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            backgroundColor: branding.backgroundColor,
            borderRadiusScale: branding.borderRadiusScale ? Number(branding.borderRadiusScale) : 1.0,
            fontFamilyPrimary: branding.fontFamilyPrimary ?? null,
            fontFamilySecondary: branding.fontFamilySecondary ?? null,
          },
        },
        { status: 200 }
      );
    } catch (_error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
      }
      return handleApiError(error, "Failed to update branding");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);

