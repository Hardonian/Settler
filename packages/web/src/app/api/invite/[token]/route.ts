/**
 * Invite Acceptance API Route
 * 
 * GET /api/invite/[token] - Get invite details
 * POST /api/invite/[token] - Accept invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTraceId } from '@/lib/observability/trace';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/invite/[token] - Get invite details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const traceId = getTraceId(request);
  
  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token: params.token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found', trace_id: traceId },
        { status: 404 }
      );
    }

    // Get tenant info separately
    const tenant = await prisma.tenant.findUnique({
      where: { id: invite.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `Invite has been ${invite.status}`, trace_id: traceId },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', trace_id: traceId },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        workspace: tenant,
      },
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch invite',
        message: 'Please try again later or contact support if the issue persists',
        trace_id: traceId 
      },
      { status: 200 }
    );
  }
}

/**
 * POST /api/invite/[token] - Accept invite
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const traceId = getTraceId(request);
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', trace_id: traceId },
        { status: 401 }
      );
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token: params.token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found', trace_id: traceId },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `Invite has been ${invite.status}`, trace_id: traceId },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', trace_id: traceId },
        { status: 400 }
      );
    }

    // Verify email matches (optional check - can be relaxed)
    if (invite.email !== user.email) {
      console.warn(`[Invite API] Email mismatch: invite=${invite.email}, user=${user.email}`);
      // Continue anyway - user might have changed email
    }

    // Add user to tenant using Supabase
    const { error: membershipError } = await (supabase
      .from('tenant_users') as any)
      .upsert({
        tenant_id: invite.tenantId,
        user_id: user.id,
        role: invite.role,
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,user_id',
      });

    if (membershipError) {
      console.error('[Invite API] Error adding user to tenant:', membershipError);
      throw membershipError;
    }

    // Update invite
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: user.id,
      },
    });

    // Track event
    await (supabase.rpc as any)('track_onboarding_event', {
      p_tenant_id: invite.tenantId,
      p_user_id: user.id,
      p_event_type: 'invite_accepted',
      p_step_id: 'add_teammates',
      p_trace_id: traceId,
      p_properties: JSON.stringify({ invite_id: invite.id }),
    }).catch(() => {
      // Silently fail if RPC doesn't exist
    });

    return NextResponse.json({
      success: true,
      workspaceId: invite.tenantId,
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to accept invite',
        message: 'Please try again later or contact support if the issue persists',
        trace_id: traceId 
      },
      { status: 200 }
    );
  }
}
