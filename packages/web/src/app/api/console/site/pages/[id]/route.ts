/**
 * Site Builder Page API (Single Page)
 * 
 * GET: Get page by ID
 * PUT: Update page
 * DELETE: Delete page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';
import { PageBlock, validateBlock } from '@/domain/siteBuilder/pageSchema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/console/site/pages/[id]
 * Get page by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    const page = await prisma.tenantPage.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    // Check tenant access
    if (page.tenantId !== tenantContext.tenantId) {
      const canView = await checkPermission(
        SiteBuilderPermission.VIEW_ALL_TENANTS,
        tenantContext.tenantId
      );
      if (!canView) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/console/site/pages/[id]
 * Update page
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    // Get existing page
    const existing = await prisma.tenantPage.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    // Check tenant access
    if (existing.tenantId !== tenantContext.tenantId) {
      const canUpdate = await checkPermission(
        SiteBuilderPermission.UPDATE_ANY_TENANT,
        tenantContext.tenantId
      );
      if (!canUpdate) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    } else {
      // Check permission for own tenant
      const canUpdate = await checkPermission(
        SiteBuilderPermission.UPDATE_PAGE,
        tenantContext.tenantId
      );
      if (!canUpdate) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    const body = await request.json();
    const {
      slug,
      pageType,
      blocks,
      seoTitle,
      seoDescription,
      seoImageUrl,
      isDraft,
    } = body as {
      slug?: string;
      pageType?: string;
      blocks?: unknown[];
      seoTitle?: string;
      seoDescription?: string;
      seoImageUrl?: string;
      isDraft?: boolean;
    };
    
    // Validate blocks if provided
    let validatedBlocks: PageBlock[] | undefined;
    if (blocks !== undefined) {
      validatedBlocks = [];
      for (const block of blocks) {
        const validated = validateBlock(block);
        if (!validated) {
          return NextResponse.json(
            { error: `Invalid block: ${JSON.stringify(block)}` },
            { status: 400 }
          );
        }
        validatedBlocks.push(validated);
      }
    }
    
    // Check slug uniqueness if changing
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.tenantPage.findUnique({
        where: {
          tenantId_slug: {
            tenantId: existing.tenantId,
            slug,
          },
        },
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Page with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Create revision before update
    await prisma.tenantPageRevision.create({
      data: {
        tenantPageId: id,
        editorUserId: userId,
        snapshot: {
          blocks: existing.blocks,
          seoTitle: existing.seoTitle,
          seoDescription: existing.seoDescription,
          seoImageUrl: existing.seoImageUrl,
        } as unknown as any,
      },
    });
    
    // Update page
    const page = await prisma.tenantPage.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(pageType !== undefined && { pageType }),
        ...(validatedBlocks !== undefined && { blocks: validatedBlocks as unknown as any[] }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoImageUrl !== undefined && { seoImageUrl }),
        ...(isDraft !== undefined && { isDraft }),
      },
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
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/console/site/pages/[id]
 * Delete page
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    const page = await prisma.tenantPage.findUnique({
      where: { id },
    });
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    // Check permission
    if (page.tenantId !== tenantContext.tenantId) {
      const canDelete = await checkPermission(
        SiteBuilderPermission.DELETE_TENANT,
        tenantContext.tenantId
      );
      if (!canDelete) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    } else {
      const canDelete = await checkPermission(
        SiteBuilderPermission.DELETE_PAGE,
        tenantContext.tenantId
      );
      if (!canDelete) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    await prisma.tenantPage.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
