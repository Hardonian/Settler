/**
 * Create Reconciliation Run (Idempotent)
 * 
 * POST /api/runs/create
 * 
 * Creates a new reconciliation run with idempotency support.
 * If same idempotency_key exists, returns existing run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateInputManifest } from '@/lib/ingest/manifest';
import { requireWorkspaceMembership } from '@/lib/authz';
import { createLogger, generateCorrelationId } from '@/lib/logger';
import { z } from 'zod';

const CreateRunSchema = z.object({
  workspace_id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  input_manifest: z.record(z.string(), z.unknown()),
  name: z.string().optional(),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const logger = createLogger();
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json();
    const validated = CreateRunSchema.parse(body);

    // Verify workspace membership
    await requireWorkspaceMembership(validated.workspace_id);

    // Validate input manifest
    const manifestValidation = validateInputManifest(validated.input_manifest);
    if (!manifestValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid input manifest',
          details: manifestValidation.errors?.issues,
          correlationId,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated', correlationId },
        { status: 401 }
      );
    }

    // Check for existing run with same idempotency_key
    const { data: existing } = await (supabase
      .from('recon_runs' as any)
      .select('*')
      .eq('workspace_id', validated.workspace_id)
      .eq('idempotency_key', validated.idempotency_key)
      .single() as any);

    if (existing) {
      logger.info('Returning existing run (idempotency)', {
        runId: existing.id,
        idempotencyKey: validated.idempotency_key,
      });

      return NextResponse.json({
        run: existing,
        created: false,
        correlationId,
      });
    }

    // Create new run
    const { data: run, error: createError } = await (supabase
      .from('recon_runs' as any)
      .insert({
        workspace_id: validated.workspace_id,
        created_by: user.id,
        idempotency_key: validated.idempotency_key,
        input_manifest: validated.input_manifest,
        status: 'created',
        name: validated.name || 'Reconciliation Run',
      } as any)
      .select()
      .single() as any);

    if (createError || !run) {
      logger.error('Failed to create run', createError as Error);
      // Never return 500 - return actionable error message
      return NextResponse.json(
        {
          error: 'Failed to create run',
          message: createError?.message || 'Unable to create reconciliation run. Please try again.',
          correlationId,
          retryable: true,
        },
        { status: 200 }
      );
    }

    // Create initial event
    await (supabase.from('run_events' as any).insert({
      workspace_id: validated.workspace_id,
      run_id: run.id,
      type: 'state_change',
      payload: {
        from: null,
        to: 'created',
        correlationId,
      },
      created_by: user.id,
    } as any) as any);

    // Enqueue job to process the run
    const { error: jobError } = await (supabase.from('jobs' as any).insert({
      workspace_id: validated.workspace_id,
      type: 'run.process',
      payload: {
        run_id: run.id,
        correlation_id: correlationId,
      },
      idempotency_key: `run.process.${run.id}`,
      run_id: run.id,
      status: 'queued',
    } as any) as any);

    if (jobError) {
      logger.error('Failed to enqueue job', jobError as Error);
      // Don't fail the request - job can be retried
    }

    // Track usage: Reconciliation run creation
    try {
      const { trackReconciliationTransaction } = await import('@/middleware/usage-tracking');
      // Get billing account from workspace/tenant
      const { data: billingAccount } = await (supabase
        .from('billing_accounts' as any)
        .select('id, tenant_id, user_id')
        .eq('tenant_id', validated.workspace_id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single() as any);
      
      if (billingAccount) {
        await trackReconciliationTransaction(
          billingAccount.id,
          billingAccount.tenant_id || validated.workspace_id,
          billingAccount.user_id || user.id,
          1, // Run creation = 1 usage event
          undefined // Will be set when run processes transactions
        );
      }
    } catch (usageError) {
      // Don't fail run creation if usage tracking fails
      logger.warn('Usage tracking failed', { error: usageError });
    }

    logger.info('Created run', {
      runId: run.id,
      workspaceId: validated.workspace_id,
      correlationId,
    });

    return NextResponse.json({
      run,
      created: true,
      correlationId,
    });
  } catch (error) {
    logger.error('Error creating run', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
          correlationId,
        },
        { status: 400 }
      );
    }

    // Never return 500 - return actionable error message
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        correlationId,
        retryable: true,
      },
      { status: 200 }
    );
  }
}
