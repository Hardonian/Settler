/**
 * Experiment Metric Event API
 * 
 * POST: Track an experiment metric event (view, click, conversion)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

/**
 * POST /api/experiments/event
 * Track experiment metric event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      experimentId,
      variantKey,
      eventType,
      sessionId,
      userId,
      meta = {},
    } = body as {
      experimentId: string;
      variantKey: string;
      eventType: 'view' | 'click' | 'conversion' | 'custom';
      sessionId?: string;
      userId?: string;
      meta?: Record<string, unknown>;
    };
    
    // Validate required fields
    if (!experimentId || !variantKey || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get or create session ID
    const cookieStore = await cookies();
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      const existingSession = cookieStore.get('experiment_session');
      if (existingSession) {
        finalSessionId = existingSession.value;
      } else {
        finalSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        cookieStore.set('experiment_session', finalSessionId, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: false,
          sameSite: 'lax',
        });
      }
    }
    
    // Get experiment to find tenant and page
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      select: {
        tenantId: true,
        targetPageId: true,
        status: true,
      },
    });
    
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }
    
    // Only track if experiment is running
    if (experiment.status !== 'running') {
      return NextResponse.json(
        { error: 'Experiment is not running' },
        { status: 400 }
      );
    }
    
    // Create metric event
    await prisma.experimentMetricEvent.create({
      data: {
        experimentId,
        variantKey,
        tenantId: experiment.tenantId,
        pageId: experiment.targetPageId,
        eventType,
        sessionId: finalSessionId,
        userId: userId || null,
        meta: meta as unknown as any,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking experiment event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
