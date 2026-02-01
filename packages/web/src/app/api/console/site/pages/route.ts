/**
 * Console Site Builder - Pages API
 *
 * GET  /api/console/site/pages  - List tenant pages
 * POST /api/console/site/pages  - Create a new draft page
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreatePageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .refine((s) => !s.startsWith("/"), "Slug must not start with '/'")
    .refine((s) => !s.includes(" "), "Slug must not contain spaces"),
  pageType: z.string().min(1).max(40).default("marketing"),
  blocks: z.array(z.unknown()).default([]),
  isDraft: z.boolean().default(true),
});

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ pages: [] }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_TENANT_CONFIG, tenantId);

      const pages = await prisma.tenantPage.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          pageType: true,
          seoTitle: true,
          isDraft: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ pages }, { status: 200 });
    } catch (_error) {
      return handleApiError(error, "Failed to load pages");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.CREATE_PAGE, tenantId);

      const body = CreatePageSchema.parse(await request.json());
      const blocksJson = JSON.parse(JSON.stringify(body.blocks ?? [])) as Prisma.InputJsonValue;

      // Prevent duplicate slug per tenant
      const existing = await prisma.tenantPage.findUnique({
        where: {
          tenantId_slug: {
            tenantId,
            slug: body.slug,
          },
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }

      const page = await prisma.tenantPage.create({
        data: {
          tenantId,
          slug: body.slug,
          pageType: body.pageType,
          blocks: blocksJson,
          isDraft: body.isDraft,
        },
        select: {
          id: true,
          slug: true,
          pageType: true,
          seoTitle: true,
          seoDescription: true,
          seoImageUrl: true,
          isDraft: true,
          blocks: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ page }, { status: 201 });
    } catch (_error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
      }
      return handleApiError(error, "Failed to create page");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);

