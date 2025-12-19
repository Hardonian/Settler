/**
 * Run Processor Job Handler
 * 
 * Processes reconciliation run jobs through state machine stages.
 */

import { Job } from '@/lib/jobs/worker';
import { createClient } from '@/lib/supabase/server';
import { transitionState, RunStatus } from '@/lib/run-state';
import { createLogger } from '@/lib/logger';

/**
 * Process a run.process job
 */
export async function processRunJob(job: Job): Promise<void> {
  const supabase = await createClient();
  const logger = createLogger({
    jobId: job.id,
    runId: job.run_id,
    workspaceId: job.workspace_id,
  });

  if (!job.run_id) {
    throw new Error('run.process job missing run_id');
  }

  // Get current run state
  const { data: run, error: runError } = await supabase
    .from('recon_runs')
    .select('*')
    .eq('id', job.run_id)
    .eq('workspace_id', job.workspace_id)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${job.run_id}`);
  }

  const currentStatus = run.status as RunStatus;
  logger.info('Processing run', { currentStatus });

  // Process based on current status
  switch (currentStatus) {
    case 'created':
      await transitionToQueued(run.id, run.workspace_id);
      break;
    case 'queued':
      await transitionToIngesting(run.id, run.workspace_id, logger);
      break;
    case 'ingesting':
      await transitionToValidating(run.id, run.workspace_id, logger);
      break;
    case 'validating':
      await transitionToReconciling(run.id, run.workspace_id, logger);
      break;
    case 'reconciling':
      await transitionToCompleted(run.id, run.workspace_id, logger);
      break;
    default:
      throw new Error(`Cannot process run in status: ${currentStatus}`);
  }
}

/**
 * Transition: created -> queued
 */
async function transitionToQueued(runId: string, workspaceId: string): Promise<void> {
  const supabase = await createClient();
  const nextStatus = transitionState('created', 'queued');

  await supabase
    .from('recon_runs')
    .update({
      status: nextStatus,
      started_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .eq('status', 'created'); // Optimistic locking
}

/**
 * Transition: queued -> ingesting
 */
async function transitionToIngesting(
  runId: string,
  workspaceId: string,
  logger: ReturnType<typeof createLogger>
): Promise<void> {
  const supabase = await createClient();
  const nextStatus = transitionState('queued', 'ingesting');

  // Simulate ingestion work
  logger.info('Starting ingestion stage');
  
  // TODO: Implement actual ingestion logic
  // For now, simulate with a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  await supabase
    .from('recon_runs')
    .update({
      status: nextStatus,
    })
    .eq('id', runId)
    .eq('status', 'queued');

  // Emit progress event
  await supabase.from('run_events').insert({
    workspace_id: workspaceId,
    run_id: runId,
    type: 'ingest_progress',
    payload: { stage: 'ingesting', progress: 0 },
  });
}

/**
 * Transition: ingesting -> validating
 */
async function transitionToValidating(
  runId: string,
  workspaceId: string,
  logger: ReturnType<typeof createLogger>
): Promise<void> {
  const supabase = await createClient();
  const nextStatus = transitionState('ingesting', 'validating');

  logger.info('Starting validation stage');

  // TODO: Implement actual validation logic
  await new Promise(resolve => setTimeout(resolve, 1000));

  await supabase
    .from('recon_runs')
    .update({
      status: nextStatus,
    })
    .eq('id', runId)
    .eq('status', 'ingesting');

  await supabase.from('run_events').insert({
    workspace_id: workspaceId,
    run_id: runId,
    type: 'validation_error', // or validation_progress
    payload: { stage: 'validating', progress: 0 },
  });
}

/**
 * Transition: validating -> reconciling
 */
async function transitionToReconciling(
  runId: string,
  workspaceId: string,
  logger: ReturnType<typeof createLogger>
): Promise<void> {
  const supabase = await createClient();
  const nextStatus = transitionState('validating', 'reconciling');

  logger.info('Starting reconciliation stage');

  // TODO: Implement actual reconciliation logic
  await new Promise(resolve => setTimeout(resolve, 2000));

  await supabase
    .from('recon_runs')
    .update({
      status: nextStatus,
    })
    .eq('id', runId)
    .eq('status', 'validating');

  await supabase.from('run_events').insert({
    workspace_id: workspaceId,
    run_id: runId,
    type: 'reconciliation_progress',
    payload: { stage: 'reconciling', progress: 0 },
  });
}

/**
 * Transition: reconciling -> completed
 */
async function transitionToCompleted(
  runId: string,
  workspaceId: string,
  logger: ReturnType<typeof createLogger>
): Promise<void> {
  const supabase = await createClient();
  const nextStatus = transitionState('reconciling', 'completed');

  logger.info('Completing run');

  // TODO: Calculate final summary
  const resultSummary = {
    total: 0,
    matched: 0,
    unmatched: 0,
    conflicts: 0,
  };

  await supabase
    .from('recon_runs')
    .update({
      status: nextStatus,
      completed_at: new Date().toISOString(),
      result_summary: resultSummary,
    })
    .eq('id', runId)
    .eq('status', 'reconciling');

  await supabase.from('run_events').insert({
    workspace_id: workspaceId,
    run_id: runId,
    type: 'completion',
    payload: { summary: resultSummary },
  });
}
