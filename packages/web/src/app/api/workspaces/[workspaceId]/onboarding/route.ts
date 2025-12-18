/**
 * Tenant-Scoped Onboarding API Routes
 * 
 * GET /api/workspaces/[workspaceId]/onboarding - Get onboarding progress
 * POST /api/workspaces/[workspaceId]/onboarding/complete - Complete a step
 * POST /api/workspaces/[workspaceId]/onboarding/skip - Skip a step
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTraceId } from '@/lib/observability/trace';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const completeStepSchema = z.object({
  stepId: z.string(),
});

/**
 * GET /api/workspaces/[workspaceId]/onboarding - Get onboarding progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
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

    // Check user is member of workspace
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', params.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace', trace_id: traceId },
        { status: 403 }
      );
    }

    // Get onboarding progress
    const { data: progress, error } = await supabase
      .from('tenant_onboarding_progress')
      .select('*')
      .eq('tenant_id', params.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Onboarding API] Error fetching progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress', trace_id: traceId },
        { status: 500 }
      );
    }

    // If no progress, create initial
    if (!progress) {
      const { data: newProgress, error: createError } = await supabase
        .from('tenant_onboarding_progress')
        .insert({
          tenant_id: params.workspaceId,
          user_id: user.id,
          current_step: 'create_workspace',
          completed_steps: [],
          skipped_steps: [],
          progress: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Onboarding API] Error creating progress:', createError);
        return NextResponse.json(
          { error: 'Failed to initialize progress', trace_id: traceId },
          { status: 500 }
        );
      }

      return NextResponse.json({
        progress: {
          currentStep: newProgress.current_step,
          completedSteps: newProgress.completed_steps || [],
          skippedSteps: newProgress.skipped_steps || [],
          progress: newProgress.progress,
          completedAt: newProgress.completed_at,
        },
        steps: getOnboardingSteps(),
        trace_id: traceId,
      });
    }

    const steps = getOnboardingStepsWithStatus(
      progress.current_step,
      progress.completed_steps || [],
      progress.skipped_steps || []
    );

    return NextResponse.json({
      progress: {
        currentStep: progress.current_step,
        completedSteps: progress.completed_steps || [],
        skippedSteps: progress.skipped_steps || [],
        progress: progress.progress,
        completedAt: progress.completed_at,
      },
      steps,
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress', trace_id: traceId },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/onboarding/complete - Complete a step
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
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

    // Check user is member of workspace
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', params.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace', trace_id: traceId },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { stepId } = completeStepSchema.parse(body);

    // Complete step using Supabase function
    const { data: result, error } = await supabase.rpc('complete_onboarding_step', {
      p_tenant_id: params.workspaceId,
      p_user_id: user.id,
      p_step_id: stepId,
      p_trace_id: traceId,
    });

    if (error) {
      console.error('[Onboarding API] Error completing step:', error);
      return NextResponse.json(
        { error: 'Failed to complete step', trace_id: traceId },
        { status: 500 }
      );
    }

    const progress = result as {
      current_step: string;
      completed_steps: string[];
      progress: number;
      completed_at: string | null;
    };

    // Check if activation is complete
    if (progress.progress >= 100) {
      await supabase.rpc('track_onboarding_event', {
        p_tenant_id: params.workspaceId,
        p_user_id: user.id,
        p_event_type: 'activation_complete',
        p_step_id: null,
        p_trace_id: traceId,
        p_properties: JSON.stringify({ progress: progress.progress }),
      });
    }

    const steps = getOnboardingStepsWithStatus(
      progress.current_step,
      progress.completed_steps,
      []
    );

    return NextResponse.json({
      progress: {
        currentStep: progress.current_step,
        completedSteps: progress.completed_steps,
        progress: progress.progress,
        completedAt: progress.completed_at,
      },
      steps,
      trace_id: traceId,
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors, trace_id: traceId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete step', trace_id: traceId },
      { status: 500 }
    );
  }
}

// Onboarding steps definition
const ONBOARDING_STEPS = [
  {
    id: 'create_workspace',
    title: 'Create Workspace',
    description: 'Set up your workspace',
    actionLabel: 'Create Workspace',
    actionUrl: '/console/onboarding?step=create_workspace',
    optional: false,
  },
  {
    id: 'add_teammates',
    title: 'Add Teammates',
    description: 'Invite your team members (optional)',
    actionLabel: 'Invite Team',
    actionUrl: '/console/onboarding?step=add_teammates',
    optional: true,
  },
  {
    id: 'connect_data_source',
    title: 'Connect Data Source',
    description: 'Connect your first data source or upload a sample file',
    actionLabel: 'Connect Data',
    actionUrl: '/console/onboarding?step=connect_data_source',
    optional: false,
  },
  {
    id: 'run_first_reconciliation',
    title: 'Run First Reconciliation',
    description: 'Execute your first reconciliation job',
    actionLabel: 'Run Job',
    actionUrl: '/console/playground/reconcile',
    optional: false,
  },
  {
    id: 'view_results',
    title: 'View Results',
    description: 'See your reconciliation results',
    actionLabel: 'View Dashboard',
    actionUrl: '/console',
    optional: false,
  },
];

function getOnboardingSteps() {
  return ONBOARDING_STEPS;
}

function getOnboardingStepsWithStatus(
  currentStep: string,
  completedSteps: string[],
  skippedSteps: string[]
) {
  return ONBOARDING_STEPS.map(step => {
    if (completedSteps.includes(step.id)) {
      return { ...step, status: 'completed' as const };
    }
    if (skippedSteps.includes(step.id)) {
      return { ...step, status: 'skipped' as const };
    }
    if (step.id === currentStep) {
      return { ...step, status: 'current' as const };
    }
    return { ...step, status: 'pending' as const };
  });
}
