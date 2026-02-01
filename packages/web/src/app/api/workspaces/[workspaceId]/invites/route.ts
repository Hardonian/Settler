/**
 * Workspace Invites API Routes
 * 
 * POST /api/workspaces/[workspaceId]/invites - Create an invite
 * GET /api/workspaces/[workspaceId]/invites - List invites
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTraceId } from '@/lib/observability/trace';
import { prisma } from '@/shared/db/prismaClient';
import { z } from 'zod';
import crypto from 'crypto';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

/**
 * POST /api/workspaces/[workspaceId]/invites - Create an invite
 */
export const POST = withSecurity(
  withUniversalBillingGate(async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const traceId = await getTraceId(request);
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', trace_id: traceId },
        { status: 401 }
      );
    }

    // Check user has admin/owner role
     
    const { data: membership } = await (supabase
      .from('tenant_users') as any)
      .select('role')
      .eq('tenant_id', params.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes((membership as { role: string }).role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Owner role required', trace_id: traceId },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createInviteSchema.parse(body);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invite
    const invite = await prisma.workspaceInvite.create({
      data: {
        tenantId: params.workspaceId,
        invitedBy: user.id,
        email: validated.email,
        role: validated.role,
        token,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Track event
     
    await (supabase.rpc as any)('track_onboarding_event', {
      p_tenant_id: params.workspaceId,
      p_user_id: user.id,
      p_event_type: 'invite_sent',
      p_step_id: 'add_teammates',
      p_trace_id: traceId,
      p_properties: JSON.stringify({ invite_id: invite.id, email: validated.email, role: validated.role }),
    }).catch(() => {
      // Silently fail if RPC doesn't exist
    });

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`,
      trace_id: traceId,
    });
  } catch (error) {
    appLogger.error('[Invite API] Error', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues, trace_id: traceId },
        { status: 400 }
      );
    }

    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create invite',
        message: 'Please try again later or contact support if the issue persists',
        trace_id: traceId 
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

/**
 * GET /api/workspaces/[workspaceId]/invites - List invites
 */
export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const traceId = await getTraceId(request);
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', trace_id: traceId },
        { status: 401 }
      );
    }

    // Check user has admin/owner role
     
    const { data: membership } = await (supabase
      .from('tenant_users') as any)
      .select('role')
      .eq('tenant_id', params.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes((membership as { role: string }).role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Owner role required', trace_id: traceId },
        { status: 403 }
      );
    }

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        tenantId: params.workspaceId,
        status: { in: ['pending', 'accepted'] },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        acceptedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invites,
      trace_id: traceId,
    });
  } catch (error) {
    appLogger.error('[Invite API] Error', error);
    // Never return 500 - return empty invites array with graceful error message
    return NextResponse.json(
      { 
        invites: [],
        error: 'Failed to fetch invites',
        message: 'Please try again later or contact support if the issue persists',
        trace_id: traceId 
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
