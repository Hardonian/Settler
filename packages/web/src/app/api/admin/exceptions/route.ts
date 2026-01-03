/**
 * Admin Exceptions API
 * 
 * Returns exception queue items for admin dashboard.
 * Requires super admin access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { ExceptionsQueryParamsSchema, ExceptionItemSchema } from '@/lib/admin/metrics/types';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = ExceptionsQueryParamsSchema.parse({
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      source: searchParams.get('source') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    });

    // Build where clause
    const whereClause: any = {};
    if (params.tenantId) {
      whereClause.tenantId = params.tenantId;
    }
    if (params.severity) {
      whereClause.severity = params.severity;
    }
    if (params.source) {
      whereClause.driftType = params.source;
    }
    if (params.status) {
      whereClause.acknowledged = params.status === 'resolved' || params.status === 'exported';
    }

    // Fetch exceptions (using DriftEvent as exception model)
    const [exceptions, total] = await Promise.all([
      prisma.driftEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
        select: {
          id: true,
          tenantId: true,
          driftType: true,
          severity: true,
          acknowledged: true,
          acknowledgedBy: true,
          acknowledgedAt: true,
          createdAt: true,
          updatedAt: true,
          reconJobId: true,
          fieldPath: true,
          expectedValue: true,
          actualValue: true,
          metadata: true,
        },
      }),
      prisma.driftEvent.count({ where: whereClause }),
    ]);

    // Transform to ExceptionItem format
    const items = exceptions.map(ex => {
      const status = ex.acknowledged ? 'resolved' : 'new';
      const now = new Date();
      const createdAt = new Date(ex.createdAt);
      const slaTimer = now.getTime() - createdAt.getTime();

      return ExceptionItemSchema.parse({
        id: ex.id,
        runId: ex.reconJobId || null,
        matchId: null, // Not directly available from DriftEvent
        tenantId: ex.tenantId,
        source: ex.driftType || 'unknown',
        severity: (ex.severity || 'info') as 'info' | 'warn' | 'critical',
        status: status as 'new' | 'in_review' | 'resolved' | 'exported',
        reason: ex.fieldPath ? `Field mismatch: ${ex.fieldPath}` : 'Drift detected',
        ruleId: null, // Would need to extract from metadata
        detectorId: null, // Would need to extract from metadata
        evidence: {
          expected: ex.expectedValue,
          actual: ex.actualValue,
          ...(ex.metadata as Record<string, unknown> || {}),
        },
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt?.toISOString() || ex.createdAt.toISOString(),
        reviewedBy: ex.acknowledgedBy || null,
        reviewedAt: ex.acknowledgedAt?.toISOString() || null,
        slaTimer,
      });
    });

    return NextResponse.json({
      items,
      total,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    console.error('[Admin Exceptions] Error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve exceptions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
