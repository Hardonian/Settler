/**
 * Site Builder Pages API
 * 
 * GET: List pages for current tenant
 * POST: Create a new page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';
import { PageBlock, validateBlock } from '@/domain/siteBuilder/pageSchema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

/**
 * GET /api/console/site/pages
 * List all pages for the current tenant
 */
export async function GET() {
  try {
    await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    // Check permission
    const canView = await checkPermission(
      SiteBuilderPermission.VIEW_TENANT_CONFIG,
      tenantContext.tenantId
    );
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const pages = await prisma.tenantPage.findMany({
      where: {
        tenantId: tenantContext.tenantId,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error listing pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/console/site/pages
 * Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    // Check permission
    const canCreate = await checkPermission(
      SiteBuilderPermission.CREATE_PAGE,
      tenantContext.tenantId
    );
    
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      slug,
      pageType = 'marketing',
      blocks = [],
      seoTitle,
      seoDescription,
      seoImageUrl,
      isDraft = true,
    } = body as {
      slug: string;
      pageType?: string;
      blocks?: unknown[];
      seoTitle?: string;
      seoDescription?: string;
      seoImageUrl?: string;
      isDraft?: boolean;
    };
    
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug' },
        { status: 400 }
      );
    }
    
    // Validate blocks
    const validatedBlocks: PageBlock[] = [];
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
    
    // Check if page with slug already exists
    const existing = await prisma.tenantPage.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenantContext.tenantId,
          slug,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Create page
    const page = await prisma.tenantPage.create({
      data: {
        tenantId: tenantContext.tenantId,
        slug,
        pageType,
        blocks: validatedBlocks as unknown as any[], // Prisma JSONB type
        seoTitle,
        seoDescription,
        seoImageUrl,
        isDraft,
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
    
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
