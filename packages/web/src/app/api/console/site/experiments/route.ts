/**
 * Experiments API
 * 
 * GET: List experiments for current tenant
 * POST: Create a new experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';
import { PageBlock, validateBlock } from '@/domain/siteBuilder/pageSchema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/console/site/experiments
 * List all experiments for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    const experiments = await prisma.experiment.findMany({
      where: {
        tenantId: tenantContext.tenantId,
      },
      include: {
        targetPage: {
          select: {
            id: true,
            slug: true,
            seoTitle: true,
          },
        },
        variants: {
          select: {
            id: true,
            key: true,
            label: true,
          },
        },
        _count: {
          select: {
            metricEvents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ experiments });
  } catch (error) {
    console.error('Error listing experiments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/console/site/experiments
 * Create a new experiment
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    // Check permission
    const canCreate = await checkPermission(
      SiteBuilderPermission.CREATE_EXPERIMENT,
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
      targetPageId,
      name,
      slug,
      primaryMetric = 'click_through',
      variants = [],
      trafficSplit = {},
    } = body as {
      targetPageId: string;
      name: string;
      slug: string;
      primaryMetric?: string;
      variants?: Array<{
        key: string;
        label: string;
        blocksOverride?: unknown[];
      }>;
      trafficSplit?: Record<string, number>;
    };
    
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug' },
        { status: 400 }
      );
    }
    
    // Check if experiment with slug already exists
    const existing = await prisma.experiment.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenantContext.tenantId,
          slug,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Experiment with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Validate target page exists and belongs to tenant
    const targetPage = await prisma.tenantPage.findUnique({
      where: { id: targetPageId },
    });
    
    if (!targetPage || targetPage.tenantId !== tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'Target page not found' },
        { status: 404 }
      );
    }
    
    // Validate variants
    if (!Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 variants required' },
        { status: 400 }
      );
    }
    
    // Validate traffic split sums to 100
    const totalSplit = Object.values(trafficSplit).reduce((sum, val) => sum + val, 0);
    if (totalSplit !== 100) {
      return NextResponse.json(
        { error: 'Traffic split must sum to 100%' },
        { status: 400 }
      );
    }
    
    // Validate variant blocks
    for (const variant of variants) {
      if (variant.blocksOverride) {
        for (const block of variant.blocksOverride) {
          const validated = validateBlock(block);
          if (!validated) {
            return NextResponse.json(
              { error: `Invalid block in variant ${variant.key}` },
              { status: 400 }
            );
          }
        }
      }
    }
    
    // Create experiment with variants
    const experiment = await prisma.experiment.create({
      data: {
        tenantId: tenantContext.tenantId,
        targetPageId,
        name,
        slug,
        primaryMetric,
        trafficSplit: trafficSplit as unknown as any,
        status: 'draft',
        variants: {
          create: variants.map(v => ({
            key: v.key,
            label: v.label,
            blocksOverride: (v.blocksOverride || []) as unknown as any[],
          })),
        },
      },
      include: {
        variants: true,
        targetPage: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });
    
    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error) {
    console.error('Error creating experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
