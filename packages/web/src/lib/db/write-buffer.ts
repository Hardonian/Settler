/**
 * Write Buffer Service - OpenAI-style Write Shedding
 *
 * Implements buffered writes to reduce database write pressure:
 * - Batches high-frequency writes (usage events, API logs, audit logs)
 * - Converts hot row UPDATEs to append-only INSERTs
 * - Provides fire-and-forget async write pattern
 * - Implements graceful degradation (fallback to sync writes if buffer fails)
 *
 * Based on OpenAI's write shedding patterns:
 * - Append-only event tables
 * - Buffered aggregation
 * - Write queue with periodic flush
 */

import { prisma } from '@/shared/db/prismaClient';
import { appLogger } from '@/lib/utils/logger';
import { Redis } from '@upstash/redis';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUFFER_CONFIG = {
  // Flush interval in milliseconds
  flushInterval: 10_000, // 10 seconds

  // Maximum buffer size before forced flush (per event type)
  maxBufferSize: 1000,

  // Batch insert size
  batchSize: 100,

  // Enable/disable buffering (falls back to sync if disabled)
  enabled: process.env.NODE_ENV === 'production' && process.env.REDIS_URL !== undefined,

  // Fallback to sync writes if buffer fails
  fallbackToSync: true,
} as const;

// ============================================================================
// REDIS CLIENT (OPTIONAL)
// ============================================================================

let redis: Redis | null = null;

if (BUFFER_CONFIG.enabled && process.env.REDIS_URL) {
  try {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    appLogger.warn('[Write Buffer] Redis initialization failed, buffering disabled', { error });
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface UsageEventBuffer {
  billingAccountId: string;
  projectId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  eventType: string;
  integrationId?: string | null;
  addOnId?: string | null;
  quantity: number;
  unit?: string | null;
  metadata?: any;
  timestamp: Date;
}

export interface ApiCallLogBuffer {
  tenantId?: string | null;
  userId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string | null;
  ipAddress?: string | null;
  error?: string | null;
  createdAt: Date;
}

export interface AuditLogBuffer {
  userId?: string | null;
  billingAccountId?: string | null;
  tenantId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  changes?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
  createdAt: Date;
}

// ============================================================================
// IN-MEMORY BUFFERS (FALLBACK)
// ============================================================================

const inMemoryBuffers = {
  usageEvents: [] as UsageEventBuffer[],
  apiCallLogs: [] as ApiCallLogBuffer[],
  auditLogs: [] as AuditLogBuffer[],
};

// ============================================================================
// BUFFER OPERATIONS
// ============================================================================

/**
 * Add usage event to buffer (fire-and-forget)
 */
export async function bufferUsageEvent(event: UsageEventBuffer): Promise<void> {
  if (!BUFFER_CONFIG.enabled) {
    // Fallback to sync write
    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteUsageEvent(event);
    }
    return;
  }

  try {
    if (redis) {
      // Push to Redis list
      await redis.rpush('buffer:usage_events', JSON.stringify(event));

      // Check buffer size and flush if needed
      const bufferSize = await redis.llen('buffer:usage_events');
      if (bufferSize >= BUFFER_CONFIG.maxBufferSize) {
        appLogger.warn('[Write Buffer] Usage events buffer full, triggering flush', { bufferSize });
        // Trigger immediate flush (non-blocking)
        void flushUsageEvents();
      }
    } else {
      // Fallback to in-memory buffer
      inMemoryBuffers.usageEvents.push(event);

      if (inMemoryBuffers.usageEvents.length >= BUFFER_CONFIG.maxBufferSize) {
        void flushUsageEvents();
      }
    }
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to buffer usage event', { error, event });

    // Fallback to sync write
    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteUsageEvent(event);
    }
  }
}

/**
 * Add API call log to buffer (fire-and-forget)
 */
export async function bufferApiCallLog(log: ApiCallLogBuffer): Promise<void> {
  if (!BUFFER_CONFIG.enabled) {
    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteApiCallLog(log);
    }
    return;
  }

  try {
    if (redis) {
      await redis.rpush('buffer:api_call_logs', JSON.stringify(log));

      const bufferSize = await redis.llen('buffer:api_call_logs');
      if (bufferSize >= BUFFER_CONFIG.maxBufferSize) {
        void flushApiCallLogs();
      }
    } else {
      inMemoryBuffers.apiCallLogs.push(log);

      if (inMemoryBuffers.apiCallLogs.length >= BUFFER_CONFIG.maxBufferSize) {
        void flushApiCallLogs();
      }
    }
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to buffer API call log', { error, log });

    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteApiCallLog(log);
    }
  }
}

/**
 * Add audit log to buffer (fire-and-forget)
 */
export async function bufferAuditLog(log: AuditLogBuffer): Promise<void> {
  if (!BUFFER_CONFIG.enabled) {
    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteAuditLog(log);
    }
    return;
  }

  try {
    if (redis) {
      await redis.rpush('buffer:audit_logs', JSON.stringify(log));

      const bufferSize = await redis.llen('buffer:audit_logs');
      if (bufferSize >= BUFFER_CONFIG.maxBufferSize) {
        void flushAuditLogs();
      }
    } else {
      inMemoryBuffers.auditLogs.push(log);

      if (inMemoryBuffers.auditLogs.length >= BUFFER_CONFIG.maxBufferSize) {
        void flushAuditLogs();
      }
    }
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to buffer audit log', { error, log });

    if (BUFFER_CONFIG.fallbackToSync) {
      await syncWriteAuditLog(log);
    }
  }
}

// ============================================================================
// FLUSH OPERATIONS (BATCH INSERT)
// ============================================================================

/**
 * Flush usage events buffer to database
 */
export async function flushUsageEvents(): Promise<void> {
  const startTime = Date.now();
  let events: UsageEventBuffer[] = [];

  try {
    if (redis) {
      // Pop up to batchSize items from Redis list
      const items = await redis.lpop<string>('buffer:usage_events', BUFFER_CONFIG.batchSize);
      if (!items || items.length === 0) return;

      events = items.map((item) => JSON.parse(item));
    } else {
      // Drain in-memory buffer
      events = inMemoryBuffers.usageEvents.splice(0, BUFFER_CONFIG.batchSize);
      if (events.length === 0) return;
    }

    // Batch insert
    await prisma.usageEvent.createMany({
      data: events.map((event) => ({
        ...event,
        quantity: event.quantity,
        aggregated: false,
      })),
      skipDuplicates: true,
    });

    const duration = Date.now() - startTime;
    appLogger.info('[Write Buffer] Flushed usage events', {
      count: events.length,
      duration,
    });
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to flush usage events', {
      error,
      count: events.length,
    });

    // Push back to buffer for retry (if Redis)
    if (redis && events.length > 0) {
      try {
        await redis.lpush(
          'buffer:usage_events',
          ...events.map((e) => JSON.stringify(e))
        );
      } catch (retryError) {
        appLogger.error('[Write Buffer] Failed to push back usage events', { retryError });
      }
    }
  }
}

/**
 * Flush API call logs buffer to database
 */
export async function flushApiCallLogs(): Promise<void> {
  const startTime = Date.now();
  let logs: ApiCallLogBuffer[] = [];

  try {
    if (redis) {
      const items = await redis.lpop<string>('buffer:api_call_logs', BUFFER_CONFIG.batchSize);
      if (!items || items.length === 0) return;

      logs = items.map((item) => JSON.parse(item));
    } else {
      logs = inMemoryBuffers.apiCallLogs.splice(0, BUFFER_CONFIG.batchSize);
      if (logs.length === 0) return;
    }

    // Batch insert (using raw SQL for api_call_logs table)
    // Note: Adjust column names based on actual schema
    const values = logs
      .map(
        (log) =>
          `(${log.tenantId ? `'${log.tenantId}'` : 'NULL'}, ${log.userId ? `'${log.userId}'` : 'NULL'}, '${log.method}', '${log.path}', ${log.statusCode}, ${log.responseTime}, ${log.userAgent ? `'${log.userAgent.replace(/'/g, "''")}'` : 'NULL'}, ${log.ipAddress ? `'${log.ipAddress}'` : 'NULL'}, ${log.error ? `'${log.error.replace(/'/g, "''")}'` : 'NULL'}, '${log.createdAt.toISOString()}')`
      )
      .join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO api_call_logs (tenant_id, user_id, method, path, status_code, response_time, user_agent, ip_address, error, created_at)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);

    const duration = Date.now() - startTime;
    appLogger.info('[Write Buffer] Flushed API call logs', {
      count: logs.length,
      duration,
    });
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to flush API call logs', {
      error,
      count: logs.length,
    });

    if (redis && logs.length > 0) {
      try {
        await redis.lpush(
          'buffer:api_call_logs',
          ...logs.map((l) => JSON.stringify(l))
        );
      } catch (retryError) {
        appLogger.error('[Write Buffer] Failed to push back API call logs', { retryError });
      }
    }
  }
}

/**
 * Flush audit logs buffer to database
 */
export async function flushAuditLogs(): Promise<void> {
  const startTime = Date.now();
  let logs: AuditLogBuffer[] = [];

  try {
    if (redis) {
      const items = await redis.lpop<string>('buffer:audit_logs', BUFFER_CONFIG.batchSize);
      if (!items || items.length === 0) return;

      logs = items.map((item) => JSON.parse(item));
    } else {
      logs = inMemoryBuffers.auditLogs.splice(0, BUFFER_CONFIG.batchSize);
      if (logs.length === 0) return;
    }

    // Batch insert
    await prisma.auditLog.createMany({
      data: logs.map((log) => ({
        ...log,
        metadata: log.metadata ?? {},
      })),
      skipDuplicates: true,
    });

    const duration = Date.now() - startTime;
    appLogger.info('[Write Buffer] Flushed audit logs', {
      count: logs.length,
      duration,
    });
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to flush audit logs', {
      error,
      count: logs.length,
    });

    if (redis && logs.length > 0) {
      try {
        await redis.lpush(
          'buffer:audit_logs',
          ...logs.map((l) => JSON.stringify(l))
        );
      } catch (retryError) {
        appLogger.error('[Write Buffer] Failed to push back audit logs', { retryError });
      }
    }
  }
}

// ============================================================================
// SYNC WRITE FALLBACKS
// ============================================================================

async function syncWriteUsageEvent(event: UsageEventBuffer): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        ...event,
        quantity: event.quantity,
        aggregated: false,
      },
    });
  } catch (error) {
    appLogger.error('[Write Buffer] Sync write usage event failed', { error, event });
  }
}

async function syncWriteApiCallLog(log: ApiCallLogBuffer): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO api_call_logs (tenant_id, user_id, method, path, status_code, response_time, user_agent, ip_address, error, created_at)
      VALUES (${log.tenantId ? `'${log.tenantId}'` : 'NULL'}, ${log.userId ? `'${log.userId}'` : 'NULL'}, '${log.method}', '${log.path}', ${log.statusCode}, ${log.responseTime}, ${log.userAgent ? `'${log.userAgent.replace(/'/g, "''")}'` : 'NULL'}, ${log.ipAddress ? `'${log.ipAddress}'` : 'NULL'}, ${log.error ? `'${log.error.replace(/'/g, "''")}'` : 'NULL'}, '${log.createdAt.toISOString()}')
    `);
  } catch (error) {
    appLogger.error('[Write Buffer] Sync write API call log failed', { error, log });
  }
}

async function syncWriteAuditLog(log: AuditLogBuffer): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        ...log,
        metadata: log.metadata ?? {},
      },
    });
  } catch (error) {
    appLogger.error('[Write Buffer] Sync write audit log failed', { error, log });
  }
}

// ============================================================================
// PERIODIC FLUSH (BACKGROUND TASK)
// ============================================================================

let flushIntervalId: NodeJS.Timeout | null = null;

/**
 * Start periodic buffer flushing
 */
export function startPeriodicFlush(): void {
  if (!BUFFER_CONFIG.enabled) {
    appLogger.info('[Write Buffer] Periodic flush disabled (buffering disabled)');
    return;
  }

  if (flushIntervalId) {
    appLogger.warn('[Write Buffer] Periodic flush already running');
    return;
  }

  flushIntervalId = setInterval(async () => {
    appLogger.debug('[Write Buffer] Periodic flush triggered');

    try {
      await Promise.all([flushUsageEvents(), flushApiCallLogs(), flushAuditLogs()]);
    } catch (error) {
      appLogger.error('[Write Buffer] Periodic flush failed', { error });
    }
  }, BUFFER_CONFIG.flushInterval);

  appLogger.info('[Write Buffer] Periodic flush started', {
    interval: BUFFER_CONFIG.flushInterval,
  });
}

/**
 * Stop periodic buffer flushing
 */
export function stopPeriodicFlush(): void {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
    appLogger.info('[Write Buffer] Periodic flush stopped');
  }
}

/**
 * Flush all buffers immediately (for graceful shutdown)
 */
export async function flushAll(): Promise<void> {
  appLogger.info('[Write Buffer] Flushing all buffers');

  try {
    await Promise.all([flushUsageEvents(), flushApiCallLogs(), flushAuditLogs()]);
    appLogger.info('[Write Buffer] All buffers flushed');
  } catch (error) {
    appLogger.error('[Write Buffer] Failed to flush all buffers', { error });
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    appLogger.info('[Write Buffer] SIGTERM received, flushing buffers');
    stopPeriodicFlush();
    await flushAll();
  });

  process.on('SIGINT', async () => {
    appLogger.info('[Write Buffer] SIGINT received, flushing buffers');
    stopPeriodicFlush();
    await flushAll();
  });
}
