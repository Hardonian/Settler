/**
 * Experiment Results API
 * 
 * GET: Get aggregated results for an experiment
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
 * GET /api/console/site/experiments/[id]/results
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAuth();
    const { id } = await params;
    const tenantContext = await getTenantContext();
    
    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        variants: {
          select: {
            key: true,
            label: true,
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
    
    // Check permission
    const canView = await checkPermission(
      experiment.tenantId === tenantContext.tenantId
        ? SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS
        : SiteBuilderPermission.VIEW_ALL_TENANTS,
      tenantContext.tenantId
    );
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Aggregate metrics by variant
    const variantResults = await Promise.all(
      experiment.variants.map(async (variant: { key: string; label: string }) => {
        const events = await prisma.experimentMetricEvent.findMany({
          where: {
            experimentId: id,
            variantKey: variant.key,
          },
        });
        
        const views = events.filter((e: { eventType: string }) => e.eventType === 'view').length;
        const clicks = events.filter((e: { eventType: string }) => e.eventType === 'click').length;
        const conversions = events.filter((e: { eventType: string }) => e.eventType === 'conversion').length;
        const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
        
        return {
          key: variant.key,
          label: variant.label,
          views,
          clicks,
          conversions,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      })
    );
    
    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        primaryMetric: experiment.primaryMetric,
      },
      results: variantResults,
    });
  } catch (error) {
    console.error('Error fetching experiment results:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
