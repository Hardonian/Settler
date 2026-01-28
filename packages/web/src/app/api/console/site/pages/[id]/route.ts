/**
 * Console Site Builder - Page Detail API
 *
 * GET    /api/console/site/pages/:id   - Fetch a page
 * PUT    /api/console/site/pages/:id   - Update a page (blocks + SEO)
 * DELETE /api/console/site/pages/:id   - Delete a page
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

const UpdatePageSchema = z.object({
  blocks: z.array(z.unknown()).optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(400).nullable().optional(),
  seoImageUrl: z.string().url().nullable().optional(),
  pageType: z.string().max(40).optional(),
  isDraft: z.boolean().optional(),
});

export const GET = withSecurity(
  async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ page: null }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_TENANT_CONFIG, tenantId);

      const page = await prisma.tenantPage.findFirst({
        where: { id: params.id, tenantId },
        select: {
          id: true,
          tenantId: true,
          slug: true,
          pageType: true,
          blocks: true,
          seoTitle: true,
          seoDescription: true,
          seoImageUrl: true,
          isDraft: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ page }, { status: 200 });
    } catch (error) {
      return handleApiError(error, "Failed to load page");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

export const PUT = withSecurity(
  async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.UPDATE_PAGE, tenantId);

      const body = UpdatePageSchema.parse(await request.json());

      const existing = await prisma.tenantPage.findFirst({
        where: { id: params.id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {
        ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
        ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
        ...(body.seoImageUrl !== undefined ? { seoImageUrl: body.seoImageUrl } : {}),
        ...(body.pageType !== undefined ? { pageType: body.pageType } : {}),
        ...(body.isDraft !== undefined ? { isDraft: body.isDraft } : {}),
      };

      if (body.blocks !== undefined) {
        updateData.blocks = JSON.parse(JSON.stringify(body.blocks)) as Prisma.InputJsonValue;
      }

      const page = await prisma.tenantPage.update({
        where: { id: params.id },
        data: updateData as any,
        select: {
          id: true,
          slug: true,
          pageType: true,
          blocks: true,
          seoTitle: true,
          seoDescription: true,
          seoImageUrl: true,
          isDraft: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ page }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
      }
      return handleApiError(error, "Failed to update page");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);

export const DELETE = withSecurity(
  async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ success: false, error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.DELETE_PAGE, tenantId);

      const existing = await prisma.tenantPage.findFirst({
        where: { id: params.id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      }

      await prisma.tenantPage.delete({ where: { id: params.id } });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      return handleApiError(error, "Failed to delete page");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);

