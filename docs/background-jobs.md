# Background Jobs & Async Processing

**Last Updated:** 2025-01-XX  
**Architecture:** BullMQ (Redis-backed) + Supabase Edge Functions

---

## Executive Summary

Settler uses **BullMQ** (Redis-backed) for critical background job processing and **Supabase Edge Functions** (planned) for lightweight scheduled tasks. This hybrid approach balances performance, reliability, and cost.

---

## Architecture Overview

### Job Queue System (BullMQ)

**Location:** `packages/api/src/infrastructure/queue/PrioritizedQueue.ts`

**Purpose:**
- Long-running reconciliation jobs
- Webhook delivery retries
- Export generation
- Heavy computation tasks

**Why BullMQ:**
- ✅ Reliable job processing with retries
- ✅ Priority queues (enterprise bypass)
- ✅ Job persistence (survives restarts)
- ✅ Built-in rate limiting
- ✅ Job monitoring and stats

**Requirements:**
- **Redis** (Upstash or self-hosted)
- **Worker process** to consume jobs

---

## Current Implementation

### 1. Prioritized Queue System

**Features:**
- Priority-based job execution
- Enterprise tenant bypass (immediate execution)
- Automatic retries with exponential backoff
- Job statistics and monitoring

**Usage:**
```typescript
import { PrioritizedQueue, QueuePriority } from '@/infrastructure/queue/PrioritizedQueue';

const reconciliationQueue = new PrioritizedQueue(
  'reconciliation',
  async (job) => {
    // Process reconciliation job
    await processReconciliation(job.data);
  }
);

// Start worker
reconciliationQueue.startWorker(5); // 5 concurrent jobs

// Add job
await reconciliationQueue.add(
  {
    tenantId: 'tenant-123',
    tenantTier: TenantTier.GROWTH,
    jobId: 'job-456',
    // ... job data
  },
  QueuePriority.HIGH
);
```

### 2. Webhook Delivery Queue

**Location:** `packages/api/src/utils/webhook-queue.ts`

**Current Implementation:**
- Uses Postgres table (`webhook_deliveries`) for persistence
- Processes retries with exponential backoff
- **TODO:** Migrate to BullMQ for better reliability

**Current Flow:**
1. Webhook delivery fails → stored in `webhook_deliveries` table
2. Periodic job queries pending retries
3. Retries with exponential backoff
4. Updates status on success/failure

**Recommended Migration:**
```typescript
// Use BullMQ for webhook retries
const webhookQueue = new PrioritizedQueue(
  'webhook-delivery',
  async (job) => {
    await deliverWebhook(job.data);
  }
);
```

---

## Recommended Job Types

### High Priority (Implement First)

#### 1. Reconciliation Processing
**Queue:** `reconciliation`
**Priority:** HIGH
**Concurrency:** 5-10 workers
**Retries:** 3 attempts with exponential backoff

**Use Case:**
- Process large reconciliation jobs asynchronously
- Avoid blocking API requests

**Implementation:**
```typescript
// Add to queue when job is created
await reconciliationQueue.add({
  tenantId,
  tenantTier,
  jobId: job.id,
  adapterConfig: job.config,
}, QueuePriority.NORMAL);
```

#### 2. Webhook Delivery Retries
**Queue:** `webhook-delivery`
**Priority:** NORMAL
**Concurrency:** 10 workers
**Retries:** 5 attempts with exponential backoff

**Use Case:**
- Retry failed webhook deliveries
- Ensure reliable webhook delivery

**Implementation:**
```typescript
// Queue webhook delivery
await webhookQueue.add({
  tenantId,
  webhookId,
  url,
  payload,
  secret,
}, QueuePriority.NORMAL);
```

#### 3. Export Generation
**Queue:** `export-generation`
**Priority:** NORMAL
**Concurrency:** 3 workers
**Retries:** 2 attempts

**Use Case:**
- Generate large CSV/PDF exports
- Store in Supabase Storage

**Implementation:**
```typescript
await exportQueue.add({
  tenantId,
  reportId,
  format: 'csv', // or 'pdf'
  filters: {...},
}, QueuePriority.NORMAL);
```

### Medium Priority

#### 4. Email Sending
**Queue:** `email-sending`
**Priority:** LOW
**Concurrency:** 5 workers
**Retries:** 3 attempts

**Use Case:**
- Send transactional emails (Resend)
- Batch email sending

**Implementation:**
```typescript
await emailQueue.add({
  tenantId,
  to: 'user@example.com',
  template: 'welcome',
  data: {...},
}, QueuePriority.LOW);
```

#### 5. Cache Warming
**Queue:** `cache-warming`
**Priority:** LOW
**Concurrency:** 2 workers
**Retries:** 1 attempt

**Use Case:**
- Pre-warm frequently accessed data
- Improve API response times

**Implementation:**
```typescript
// Run hourly via cron
await cacheWarmQueue.add({
  tenantId,
  cacheKeys: ['kpi-health', 'recent-jobs'],
}, QueuePriority.LOW);
```

---

## Supabase Edge Functions (Lightweight Tasks)

### When to Use Edge Functions vs BullMQ

**Use Edge Functions for:**
- ✅ Scheduled cron jobs (daily cleanup, etc.)
- ✅ Lightweight tasks (< 60s execution)
- ✅ Tasks that don't need job queue features (retries, priorities)
- ✅ Tasks that integrate with Supabase (queries, storage)

**Use BullMQ for:**
- ✅ Long-running jobs (> 60s)
- ✅ Jobs that need retries and priorities
- ✅ Jobs that need monitoring and stats
- ✅ Jobs triggered by API requests

### Recommended Edge Functions

#### 1. Data Retention Cleanup
**Function:** `data-retention`
**Schedule:** Daily at 2 AM UTC
**Purpose:** Delete old data based on retention policies

**Implementation:**
```typescript
// supabase/functions/data-retention/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const retentionDays = parseInt(Deno.env.get('DATA_RETENTION_DAYS') || '365')
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  // Delete old audit logs
  await supabase
    .from('audit_logs')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())

  // Delete old error logs (resolved)
  await supabase
    .from('error_logs')
    .delete()
    .eq('resolved', true)
    .lt('created_at', cutoffDate.toISOString())

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

#### 2. Webhook Retry Processing (Alternative)
**Function:** `webhook-retry`
**Schedule:** Every 5 minutes
**Purpose:** Process pending webhook retries

**Note:** This could also use BullMQ, but edge function is simpler for scheduled tasks.

#### 3. Cache Warming
**Function:** `cache-warm`
**Schedule:** Hourly
**Purpose:** Pre-warm frequently accessed data

---

## Worker Setup

### Development

**Option 1: Separate Worker Process**
```bash
# Start API server
npm run dev

# Start worker (separate terminal)
npm run worker
```

**Script:** Add to `package.json`:
```json
{
  "scripts": {
    "worker": "tsx src/workers/index.ts"
  }
}
```

**Worker Entry Point:**
```typescript
// src/workers/index.ts
import { reconciliationQueue } from '../infrastructure/queue';

// Start all workers
reconciliationQueue.startWorker(5);
webhookQueue.startWorker(10);
exportQueue.startWorker(3);

console.log('Workers started');
```

### Production (Vercel)

**Option 1: Vercel Background Functions**
- Create separate Vercel function for worker
- Runs continuously (or on schedule)

**Option 2: Separate Worker Service**
- Deploy worker as separate service (Railway, Render, etc.)
- Connects to same Redis instance

**Option 3: Supabase Edge Functions**
- Use edge functions for lightweight scheduled tasks
- Use BullMQ workers for API-triggered jobs

---

## Monitoring & Observability

### Job Metrics

**Prometheus Metrics:**
- `queue_depth` - Number of jobs in queue
- `job_duration_seconds` - Job processing time
- `job_failures_total` - Failed job count
- `job_completions_total` - Completed job count

**Location:** `packages/api/src/infrastructure/observability/metrics.ts`

### Job Monitoring

**BullMQ Dashboard:**
- Use `bull-board` or `bull-monitor` for job monitoring
- View job status, retries, failures

**Custom Dashboard:**
- Query Redis for job stats
- Display in admin dashboard

---

## Error Handling & Retries

### Retry Strategy

**Default Retry Configuration:**
```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2s delay
  },
}
```

**Job-Specific Retries:**
```typescript
await queue.add('job', data, {
  attempts: 5, // More retries for critical jobs
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
});
```

### Dead Letter Queue

**Location:** `packages/api/src/infrastructure/resilience/DeadLetterQueue.ts`

**Purpose:** Store jobs that fail after all retries

**Usage:**
- Manually review and resolve failed jobs
- Retry or mark as resolved

---

## Best Practices

### 1. Idempotency
- Make jobs idempotent (safe to retry)
- Use idempotency keys for critical operations

### 2. Job Data Size
- Keep job data small (< 1MB)
- Store large data in database, reference by ID

### 3. Timeouts
- Set reasonable timeouts for jobs
- Fail fast if job takes too long

### 4. Priority
- Use appropriate priorities (LOW, NORMAL, HIGH, CRITICAL)
- Enterprise tenants bypass queue (immediate execution)

### 5. Monitoring
- Monitor queue depth (alert if too high)
- Track job failure rates
- Set up alerts for stuck jobs

---

## Migration Path

### Current State
- ✅ BullMQ infrastructure exists
- ✅ PrioritizedQueue class implemented
- ⚠️ Workers may not be fully wired
- ⚠️ Webhook retries use Postgres (not BullMQ)

### Recommended Steps

1. **Wire up workers:**
   - Create worker entry point (`src/workers/index.ts`)
   - Start workers in production

2. **Migrate webhook retries to BullMQ:**
   - Replace Postgres-based retry logic with BullMQ
   - Use edge function or worker to process queue

3. **Add export generation queue:**
   - Create export queue
   - Wire up worker

4. **Add email queue:**
   - Create email queue
   - Wire up worker

5. **Set up monitoring:**
   - Add BullMQ dashboard
   - Set up alerts

---

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
