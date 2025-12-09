/**
 * Start Experiment API
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

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAuth();
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
    const canStart = await checkPermission(
      experiment.tenantId === tenantContext.tenantId
        ? SiteBuilderPermission.START_EXPERIMENT
        : SiteBuilderPermission.UPDATE_ANY_TENANT,
      tenantContext.tenantId
    );
    
    if (!canStart) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Update status
    const updated = await prisma.experiment.update({
      where: { id },
      data: {
        status: 'running',
        startsAt: new Date(),
      },
    });
    
    return NextResponse.json({ experiment: updated });
  } catch (error) {
    console.error('Error starting experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
