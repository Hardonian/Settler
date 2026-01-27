/**
 * Resolve Exception API
 * 
 * Marks an exception as resolved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { prisma } from '@/shared/db/prismaClient';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withSecurity(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { resolutionNotes } = body;

    // Get current admin status
    const adminStatus = await (await import('@/lib/auth/super-admin')).getSuperAdminStatus();
    
    // Get current metadata
    const currentEvent = await prisma.driftEvent.findUnique({ 
      where: { id }, 
      select: { metadata: true } 
    });
    
    // Update exception (using DriftEvent)
    await prisma.driftEvent.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: adminStatus.userId || null,
        metadata: {
          ...((currentEvent?.metadata as Record<string, unknown>) || {}),
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    appLogger.error('[Resolve Exception] Error', error);
    return NextResponse.json(
      { error: 'Failed to resolve exception', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
},
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
