/**
 * Console Site Builder - Publish Page API
 *
 * POST /api/console/site/pages/:id/publish
 *
 * Publishes a draft page (isDraft=false) and stores a revision snapshot.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withSecurity(
  async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ success: false, error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.PUBLISH_PAGE, tenantId);

      const page = await prisma.tenantPage.findFirst({
        where: { id: params.id, tenantId },
      });
      if (!page) {
        return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      }

      // Create a revision snapshot for audit/rollback workflows
      await prisma.tenantPageRevision.create({
        data: {
          tenantPageId: page.id,
          editorUserId: auth.userId,
          snapshot: {
            slug: page.slug,
            pageType: page.pageType,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            seoImageUrl: page.seoImageUrl,
            blocks: page.blocks,
            isDraft: page.isDraft,
            publishedAt: new Date().toISOString(),
          },
          comment: "Published from Console",
        },
      });

      const updated = await prisma.tenantPage.update({
        where: { id: page.id },
        data: {
          isDraft: false,
        },
        select: {
          id: true,
          slug: true,
          pageType: true,
          isDraft: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ success: true, page: updated }, { status: 200 });
    } catch (_error) {
      return handleApiError(error, "Failed to publish page");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);

