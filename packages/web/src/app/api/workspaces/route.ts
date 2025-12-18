/**
 * Workspace API Routes
 * 
 * POST /api/workspaces - Create a new workspace
 * GET /api/workspaces - List user's workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTraceId } from '@/lib/observability/trace';
import { prisma } from '@/shared/db/prismaClient';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

/**
 * POST /api/workspaces - Create a new workspace
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);

    // Check if slug is already taken
    const existing = await prisma.tenant.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Workspace slug already taken', trace_id: traceId },
        { status: 409 }
      );
    }

    // Create workspace using Prisma (fallback to direct insert if function doesn't exist)
    let tenantId: string;
    try {
      const { data: result, error } = await (supabase.rpc as any)('create_workspace_with_owner', {
        p_name: validated.name,
        p_slug: validated.slug,
        p_user_id: user.id,
      });

      if (error) {
        // Fallback: create manually
        const tenant = await prisma.tenant.create({
          data: {
            name: validated.name,
            slug: validated.slug,
            isActive: true,
          },
        });
        tenantId = tenant.id;

        // Add user as owner
        await (supabase.from('tenant_users') as any).insert({
          tenant_id: tenantId,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

        // Initialize onboarding progress
        await (supabase.from('tenant_onboarding_progress') as any).insert({
          tenant_id: tenantId,
          user_id: user.id,
          current_step: 'create_workspace',
          completed_steps: [],
          skipped_steps: [],
          progress: 0,
        });
      } else {
        tenantId = result as string;
      }
    } catch (error) {
      console.error('[Workspace API] Error creating workspace:', error);
      return NextResponse.json(
        { error: 'Failed to create workspace', trace_id: traceId },
        { status: 500 }
      );
    }

    // Track onboarding event (with fallback)
    try {
      await (supabase.rpc as any)('track_onboarding_event', {
        p_tenant_id: tenantId,
        p_user_id: user.id,
        p_event_type: 'onboarding_started',
        p_step_id: 'create_workspace',
        p_trace_id: traceId,
        p_properties: JSON.stringify({ workspace_name: validated.name, workspace_slug: validated.slug }),
      });
    } catch (error) {
      // Fallback: insert directly
      await (supabase.from('onboarding_events') as any).insert({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: 'onboarding_started',
        step_id: 'create_workspace',
        trace_id: traceId,
        properties: { workspace_name: validated.name, workspace_slug: validated.slug },
      });
    }

    // Complete the create_workspace step (with fallback)
    try {
      await (supabase.rpc as any)('complete_onboarding_step', {
        p_tenant_id: tenantId,
        p_user_id: user.id,
        p_step_id: 'create_workspace',
        p_trace_id: traceId,
      });
    } catch (error) {
      // Fallback: update directly
      await (supabase.from('tenant_onboarding_progress') as any).upsert({
        tenant_id: tenantId,
        user_id: user.id,
        current_step: 'add_teammates',
        completed_steps: ['create_workspace'],
        skipped_steps: [],
        progress: 20,
      }, {
        onConflict: 'tenant_id,user_id',
      });
    }

    const workspace = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        billingAccount: true,
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace?.id,
        name: workspace?.name,
        slug: workspace?.slug,
      },
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Workspace API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues, trace_id: traceId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workspace', trace_id: traceId },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces - List user's workspaces
 */
export async function GET(request: NextRequest) {
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

    // Get user's tenant memberships
    const { data: memberships, error } = await (supabase
      .from('tenant_users') as any)
      .select('tenant_id, role')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Workspace API] Error fetching memberships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workspaces', trace_id: traceId },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({
        workspaces: [],
        trace_id: traceId,
      });
    }

    const tenantIds = (memberships as Array<{ tenant_id: string; role: string }>).map(m => m.tenant_id);
    const workspaces = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    // Map workspaces with user's role
    const workspacesWithRole = workspaces.map(ws => {
      const membership = (memberships as Array<{ tenant_id: string; role: string }>).find(m => m.tenant_id === ws.id);
      return {
        ...ws,
        role: membership?.role || 'viewer',
      };
    });

    return NextResponse.json({
      workspaces: workspacesWithRole,
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Workspace API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces', trace_id: traceId },
      { status: 500 }
    );
  }
}
