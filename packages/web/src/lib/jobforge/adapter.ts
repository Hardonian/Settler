/**
 * JobForge Adapter (Settler)
 *
 * Server-only adapter for JobForge operations with explicit tenant/project mapping.
 * Enforces feature gating, safe error handling, and redaction.
 */

import 'server-only';

import { JobForgeClient } from '@jobforge/sdk-ts';
import type { JobResultRow, JobRow } from '@jobforge/shared';

import { getEnvBoolean } from '@/lib/env';
import { appLogger } from '@/lib/utils/logger';
import { redactPII, removePIIFromObject } from '@/lib/privacy/pii-filter';

export interface JobForgeTenantContext {
  tenantId: string;
  projectId: string;
}

export interface JobForgeIntegrationStatus {
  enabled: boolean;
  ready: boolean;
  missing: string[];
  bundleExecutionEnabled: boolean;
}

export interface JobForgeActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: 'disabled' | 'config' | 'execution-disabled' | 'failed';
}

export interface SubmitEventParams {
  context: JobForgeTenantContext;
  eventName: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface RunModuleDryRunParams {
  context: JobForgeTenantContext;
  moduleName: string;
  input?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface RequestBundleExecutionParams {
  context: JobForgeTenantContext;
  bundleId: string;
  reportJobId?: string;
  idempotencyKey?: string;
}

export interface JobForgeReport {
  job: JobRow | null;
  result: JobResultRow | null;
}

const SENSITIVE_KEYS = ['key', 'secret', 'token', 'authorization', 'cookie', 'password'];

let cachedClient: JobForgeClient | null = null;

function getMissingConfig(): string[] {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  return required.filter((name) => !process.env[name]);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const cleaned = removePIIFromObject(record);
    return Object.entries(cleaned).reduce<Record<string, unknown>>((acc, [key, entry]) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((needle) => lowerKey.includes(needle))) {
        acc[key] = '***REDACTED***';
        return acc;
      }
      acc[key] = sanitizeValue(entry);
      return acc;
    }, {});
  }

  if (typeof value === 'string') {
    return redactPII(value);
  }

  return value;
}

function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(data) as Record<string, unknown>;
}

export function getJobForgeIntegrationStatus(): JobForgeIntegrationStatus {
  const enabled = getEnvBoolean('JOBFORGE_INTEGRATION_ENABLED', false);
  const bundleExecutionEnabled = getEnvBoolean('JOBFORGE_BUNDLE_EXECUTION_ENABLED', false);
  const missing = enabled ? getMissingConfig() : [];
  return {
    enabled,
    ready: enabled && missing.length === 0,
    missing,
    bundleExecutionEnabled,
  };
}

function getClient(): JobForgeClient | null {
  const status = getJobForgeIntegrationStatus();
  if (!status.enabled || !status.ready) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new JobForgeClient({
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    });
  }

  return cachedClient;
}

function disabledResult(): JobForgeActionResult<never> {
  return {
    ok: false,
    code: 'disabled',
    error: 'JobForge integration is disabled.',
  };
}

function configResult(): JobForgeActionResult<never> {
  return {
    ok: false,
    code: 'config',
    error: 'JobForge integration is not configured.',
  };
}

export async function submitJobForgeEvent(
  params: SubmitEventParams
): Promise<JobForgeActionResult<JobRow>> {
  const status = getJobForgeIntegrationStatus();
  if (!status.enabled) {
    return disabledResult();
  }

  if (!status.ready) {
    return configResult();
  }

  const client = getClient();
  if (!client) {
    return configResult();
  }

  try {
    const job = await client.enqueueJob({
      tenant_id: params.context.tenantId,
      type: 'settler.admin.event',
      payload: {
        tenant_id: params.context.tenantId,
        project_id: params.context.projectId,
        event_name: params.eventName,
        payload: params.payload ?? {},
      },
      idempotency_key: params.idempotencyKey,
    });

    return { ok: true, data: job };
  } catch (error) {
    appLogger.error('JobForge event submission failed', error, {
      context: sanitizeLogData({
        tenantId: params.context.tenantId,
        projectId: params.context.projectId,
        eventName: params.eventName,
      }),
    });
    return { ok: false, code: 'failed', error: 'Failed to submit JobForge event.' };
  }
}

export async function runJobForgeModuleDryRun(
  params: RunModuleDryRunParams
): Promise<JobForgeActionResult<JobRow>> {
  const status = getJobForgeIntegrationStatus();
  if (!status.enabled) {
    return disabledResult();
  }

  if (!status.ready) {
    return configResult();
  }

  const client = getClient();
  if (!client) {
    return configResult();
  }

  try {
    const job = await client.enqueueJob({
      tenant_id: params.context.tenantId,
      type: 'settler.admin.module.dry_run',
      payload: {
        tenant_id: params.context.tenantId,
        project_id: params.context.projectId,
        module_name: params.moduleName,
        input: params.input ?? {},
        dry_run: true,
      },
      idempotency_key: params.idempotencyKey,
    });

    return { ok: true, data: job };
  } catch (error) {
    appLogger.error('JobForge module dry-run failed', error, {
      context: sanitizeLogData({
        tenantId: params.context.tenantId,
        projectId: params.context.projectId,
        moduleName: params.moduleName,
      }),
    });
    return { ok: false, code: 'failed', error: 'Failed to run JobForge module dry-run.' };
  }
}

export async function getJobForgeReport(
  context: JobForgeTenantContext,
  jobId: string
): Promise<JobForgeActionResult<JobForgeReport>> {
  const status = getJobForgeIntegrationStatus();
  if (!status.enabled) {
    return disabledResult();
  }

  if (!status.ready) {
    return configResult();
  }

  const client = getClient();
  if (!client) {
    return configResult();
  }

  try {
    const job = await client.getJob(jobId, context.tenantId);
    const result = job?.result_id
      ? await client.getResult(job.result_id, context.tenantId)
      : null;

    return { ok: true, data: { job, result } };
  } catch (error) {
    appLogger.error('JobForge report fetch failed', error, {
      context: sanitizeLogData({
        tenantId: context.tenantId,
        projectId: context.projectId,
        jobId,
      }),
    });
    return { ok: false, code: 'failed', error: 'Failed to fetch JobForge report.' };
  }
}

export async function requestJobForgeBundleExecution(
  params: RequestBundleExecutionParams
): Promise<JobForgeActionResult<JobRow>> {
  const status = getJobForgeIntegrationStatus();
  if (!status.enabled) {
    return disabledResult();
  }

  if (!status.ready) {
    return configResult();
  }

  if (!status.bundleExecutionEnabled) {
    return {
      ok: false,
      code: 'execution-disabled',
      error: 'Bundle execution requests are disabled.',
    };
  }

  const client = getClient();
  if (!client) {
    return configResult();
  }

  try {
    const job = await client.enqueueJob({
      tenant_id: params.context.tenantId,
      type: 'settler.admin.bundle.execute',
      payload: {
        tenant_id: params.context.tenantId,
        project_id: params.context.projectId,
        bundle_id: params.bundleId,
        report_job_id: params.reportJobId ?? null,
        requested_at: new Date().toISOString(),
      },
      idempotency_key: params.idempotencyKey,
    });

    return { ok: true, data: job };
  } catch (error) {
    appLogger.error('JobForge bundle execution request failed', error, {
      context: sanitizeLogData({
        tenantId: params.context.tenantId,
        projectId: params.context.projectId,
        bundleId: params.bundleId,
      }),
    });
    return { ok: false, code: 'failed', error: 'Failed to request JobForge bundle execution.' };
  }
}
