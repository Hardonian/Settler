/**
 * Experiment API (Single)
 * 
 * GET: Get experiment by ID
 * PUT: Update experiment
 * DELETE: Delete experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/console/site/experiments/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        targetPage: true,
        variants: true,
        _count: {
          select: {
            metricEvents: true,
          },
        },
      },
    });
    
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    
    // Check access
    if (experiment.tenantId !== tenantContext.tenantId) {
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
    
    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/console/site/experiments/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    const experiment = await prisma.experiment.findUnique({
      where: { id },
    });
    
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    
    // Check permission
    if (experiment.tenantId !== tenantContext.tenantId) {
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
      const canUpdate = await checkPermission(
        SiteBuilderPermission.UPDATE_EXPERIMENT,
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
    const { name, status, trafficSplit, primaryMetric } = body as {
      name?: string;
      status?: string;
      trafficSplit?: Record<string, number>;
      primaryMetric?: string;
    };
    
    // Validate status
    if (status && !['draft', 'running', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // Validate traffic split if provided
    if (trafficSplit) {
      const total = Object.values(trafficSplit).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        return NextResponse.json(
          { error: 'Traffic split must sum to 100%' },
          { status: 400 }
        );
      }
    }
    
    const updated = await prisma.experiment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(trafficSplit !== undefined && { trafficSplit: trafficSplit as unknown as any }),
        ...(primaryMetric !== undefined && { primaryMetric }),
      },
      include: {
        variants: true,
      },
    });
    
    return NextResponse.json({ experiment: updated });
  } catch (error) {
    console.error('Error updating experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/console/site/experiments/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    const experiment = await prisma.experiment.findUnique({
      where: { id },
    });
    
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    
    // Check permission
    if (experiment.tenantId !== tenantContext.tenantId) {
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
        SiteBuilderPermission.DELETE_EXPERIMENT,
        tenantContext.tenantId
      );
      if (!canDelete) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    await prisma.experiment.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
