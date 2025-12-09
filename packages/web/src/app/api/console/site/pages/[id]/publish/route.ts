/**
 * Publish Page API
 * 
 * POST: Publish a page (set isDraft to false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/console/site/pages/[id]/publish
 * Publish a page
 */
export async function POST(
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
      const canPublish = await checkPermission(
        SiteBuilderPermission.UPDATE_ANY_TENANT,
        tenantContext.tenantId
      );
      if (!canPublish) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    } else {
      const canPublish = await checkPermission(
        SiteBuilderPermission.PUBLISH_PAGE,
        tenantContext.tenantId
      );
      if (!canPublish) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    // Publish page
    const published = await prisma.tenantPage.update({
      where: { id },
      data: {
        isDraft: false,
      },
      select: {
        id: true,
        slug: true,
        isDraft: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ page: published });
  } catch (error) {
    console.error('Error publishing page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
