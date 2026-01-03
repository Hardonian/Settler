/**
 * Admin Dashboard SSE Stream
 * 
 * Server-Sent Events stream for realtime dashboard updates.
 * Implements batching, heartbeat, and graceful reconnection handling.
 * Requires super admin access.
 */

import { NextRequest } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { StreamEventSchema, HealthDeltaSchema } from '@/lib/admin/metrics/types';
import { prisma } from '@/shared/db/prismaClient';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Event batching configuration
const BATCH_INTERVAL_MS = 500; // 500ms batches
const HEARTBEAT_INTERVAL_MS = 30000; // 30s heartbeat
const MAX_BATCH_SIZE = 100;

interface PendingEvent {
  event: StreamEventSchema;
  timestamp: number;
}

/**
 * SSE Stream Handler
 */
export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = await isSuperAdmin();
  if (!adminCheck) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Super admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || null;
  const channels = (searchParams.get('channels') || 'metrics,exceptions,runs,health').split(',');

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastMetricsTimestamp = new Date();
      let lastExceptionsTimestamp = new Date();
      let lastRunsTimestamp = new Date();
      let isActive = true;
      let heartbeatTimer: NodeJS.Timeout | null = null;
      let batchTimer: NodeJS.Timeout | null = null;
      const pendingEvents: PendingEvent[] = [];

      // Send initial connection event
      const sendEvent = (data: unknown) => {
        if (!isActive) return;
        try {
          const json = JSON.stringify(data);
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        } catch (error) {
          appLogger.error('[SSE Stream] Error encoding event', error);
        }
      };

      // Send health update
      const sendHealth = (status: 'connected' | 'reconnecting' | 'offline', latency: number | null = null) => {
        const healthEvent = HealthDeltaSchema.parse({
          type: 'health',
          status,
          latency,
          timestamp: new Date().toISOString(),
        });
        sendEvent(healthEvent);
      };

      // Flush pending events batch
      const flushBatch = () => {
        if (pendingEvents.length === 0) return;

        // Sort by timestamp
        pendingEvents.sort((a, b) => a.timestamp - b.timestamp);

        // Send events (limit batch size)
        const toSend = pendingEvents.splice(0, MAX_BATCH_SIZE);
        for (const { event } of toSend) {
          sendEvent(event);
        }
      };

      // Start heartbeat
      heartbeatTimer = setInterval(() => {
        sendHealth('connected', null);
      }, HEARTBEAT_INTERVAL_MS);

      // Start batch flush timer
      batchTimer = setInterval(() => {
        flushBatch();
      }, BATCH_INTERVAL_MS);

      // Poll for changes
      const pollInterval = setInterval(async () => {
        if (!isActive) return;

        try {
          const now = new Date();

          // Check for metric changes
          if (channels.includes('metrics')) {
            const recentRuns = await prisma.reconciliationRun.findFirst({
              where: {
                ...(tenantId ? { tenantId } : {}),
                updatedAt: { gt: lastMetricsTimestamp },
              },
              orderBy: { updatedAt: 'desc' },
            });

            if (recentRuns) {
              lastMetricsTimestamp = recentRuns.updatedAt;
              pendingEvents.push({
                event: {
                  type: 'metrics_delta',
                  kpis: {
                    matchedCount: recentRuns.matchedCount || 0,
                    unmatchedCount: (recentRuns.unmatchedSourceCount || 0) + (recentRuns.unmatchedTargetCount || 0),
                    confidenceAvg: recentRuns.confidenceAvg ? Number(recentRuns.confidenceAvg) : null,
                  },
                  timestamp: new Date().toISOString(),
                } as any,
                timestamp: Date.now(),
              });
            }
          }

          // Check for exception changes
          if (channels.includes('exceptions')) {
            const recentExceptions = await prisma.driftEvent.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                createdAt: { gt: lastExceptionsTimestamp },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            });

            if (recentExceptions.length > 0) {
              lastExceptionsTimestamp = recentExceptions[0].createdAt;
              
              const added = recentExceptions.map(ex => ({
                id: ex.id,
                runId: ex.reconJobId || null,
                matchId: null,
                tenantId: ex.tenantId,
                source: ex.driftType || 'unknown',
                severity: (ex.severity || 'info') as 'info' | 'warn' | 'critical',
                status: (ex.acknowledged ? 'resolved' : 'new') as 'new' | 'in_review' | 'resolved' | 'exported',
                reason: ex.fieldPath || 'Drift detected',
                ruleId: null,
                detectorId: null,
                evidence: {
                  expected: ex.expectedValue,
                  actual: ex.actualValue,
                },
                createdAt: ex.createdAt.toISOString(),
                updatedAt: ex.updatedAt?.toISOString() || ex.createdAt.toISOString(),
                reviewedBy: ex.acknowledgedBy || null,
                reviewedAt: ex.acknowledgedAt?.toISOString() || null,
                slaTimer: Date.now() - new Date(ex.createdAt).getTime(),
              }));

              pendingEvents.push({
                event: {
                  type: 'exceptions_delta',
                  added,
                  timestamp: new Date().toISOString(),
                } as any,
                timestamp: Date.now(),
              });
            }
          }

          // Check for run changes
          if (channels.includes('runs')) {
            const recentRuns = await prisma.reconciliationRun.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                updatedAt: { gt: lastRunsTimestamp },
              },
              take: 10,
              orderBy: { updatedAt: 'desc' },
            });

            if (recentRuns.length > 0) {
              lastRunsTimestamp = recentRuns[0].updatedAt;

              for (const run of recentRuns) {
                pendingEvents.push({
                  event: {
                    type: 'run_delta',
                    run: {
                      id: run.id,
                      tenantId: run.tenantId,
                      userId: run.userId,
                      name: run.name || null,
                      status: run.status as 'pending' | 'running' | 'completed' | 'failed',
                      startedAt: run.startedAt.toISOString(),
                      completedAt: run.completedAt?.toISOString() || null,
                      sourceCount: run.sourceCount || 0,
                      targetCount: run.targetCount || 0,
                      matchedCount: run.matchedCount || 0,
                      unmatchedSourceCount: run.unmatchedSourceCount || 0,
                      unmatchedTargetCount: run.unmatchedTargetCount || 0,
                      confidenceAvg: run.confidenceAvg ? Number(run.confidenceAvg) : null,
                      errorMessage: run.errorMessage || null,
                      traceId: run.traceId || null,
                      metadata: (run.metadata as Record<string, unknown>) || {},
                      createdAt: run.createdAt.toISOString(),
                      updatedAt: run.updatedAt.toISOString(),
                    },
                    timestamp: new Date().toISOString(),
                  } as any,
                  timestamp: Date.now(),
                });
              }
            }
          }
        } catch (error) {
          console.error('[SSE Stream] Polling error:', error);
          sendHealth('reconnecting', null);
        }
      }, 2000); // Poll every 2 seconds

      // Send initial health
      sendHealth('connected', null);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (batchTimer) clearInterval(batchTimer);
        clearInterval(pollInterval);
        flushBatch(); // Flush any remaining events
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
