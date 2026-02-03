# JobForge Integration for Settler

**Production-Grade, Postgres-Native Job Queue**

JobForge is now integrated into Settler as a first-class background job processing system. It provides multi-tenant job queuing, processing, and monitoring without the need for Redis or Kafka.

## Overview

JobForge enables Settler to:
- Enqueue background jobs (contract processing, notifications, data ingestion)
- Process jobs asynchronously with workers
- Retry failed jobs with exponential backoff
- Maintain strict tenant isolation via Row Level Security (RLS)
- Track job status and results
- Handle dead-letter queue for permanently failed jobs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL/Supabase                     │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ jobforge_jobs  │  │ RPC Functions│  │  RLS Policies   │ │
│  │ (job queue)    │  │ - enqueue    │  │ (tenant guard)  │ │
│  │                │  │ - claim      │  │                 │ │
│  │ + results      │  │ - complete   │  │                 │ │
│  │ + attempts     │  │ - heartbeat  │  │                 │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ RPC calls
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼─────┐         ┌────▼─────┐       ┌─────▼────┐
    │ Settler  │         │ Worker   │       │ Admin UI │
    │ (enqueue)│         │ (process)│       │ (monitor)│
    └──────────┘         └──────────┘       └──────────┘
```

## Setup

### 1. Apply Database Migration

The JobForge migration has been integrated into Settler's migration system:

```bash
# Via Supabase CLI (recommended)
supabase db push

# OR manually via migration script
npm run db:migrate:apply
```

This creates:
- `jobforge_jobs` - Main job queue table
- `jobforge_job_results` - Job execution results
- `jobforge_job_attempts` - Attempt history for debugging
- `jobforge_connector_configs` - Tenant-specific connector settings
- RPC functions: `jobforge_enqueue_job`, `jobforge_claim_jobs`, `jobforge_complete_job`, etc.
- RLS policies for strict tenant isolation

### 2. Environment Configuration

JobForge reuses Settler's existing Supabase credentials:

```bash
# Already configured in .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

JobForge admin tooling is gated by feature flags (disabled by default):

```bash
# Enable JobForge admin + CLI tooling (default: false)
JOBFORGE_INTEGRATION_ENABLED=false

# Gate bundle execution requests (default: false)
JOBFORGE_BUNDLE_EXECUTION_ENABLED=false
```

## Usage

### Enqueuing Jobs

#### From Server-Side Code (Next.js API Routes, Server Actions)

```typescript
import { JobForgeClient } from '@jobforge/sdk-ts'
import { SettlerJobTypes } from '@jobforge/adapter-settler'

// Initialize client (server-side only!)
const jobforge = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

// Example: Contract processing job
const job = await jobforge.enqueueJob({
  tenant_id: user.tenantId,
  type: SettlerJobTypes.CONTRACT_PROCESS,
  payload: {
    contractId: 'contract-123',
    action: 'validate',
  },
  idempotency_key: `contract-process-${contractId}`, // Prevents duplicates
})

console.log(`Job enqueued: ${job.id}`)
```

#### Settler-Specific Job Types

The `@jobforge/adapter-settler` package provides pre-configured job types:

```typescript
import { SettlerJobTypes } from '@jobforge/adapter-settler'

// Available job types:
SettlerJobTypes.CONTRACT_PROCESS      // Contract processing
SettlerJobTypes.CONTRACT_NOTIFICATION // Send contract notifications
SettlerJobTypes.RECON_INGEST         // Data reconciliation ingestion
SettlerJobTypes.RECON_AUDIT          // Audit reconciliation results
SettlerJobTypes.WEBHOOK_DELIVER      // Webhook delivery with retries
SettlerJobTypes.HTTP_REQUEST         // Generic HTTP requests
```

### Monitoring Jobs

```typescript
import { JobForgeClient } from '@jobforge/sdk-ts'

const jobforge = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

// Get job status
const job = await jobforge.getJob(jobId, tenantId)
console.log(job.status) // 'queued' | 'running' | 'succeeded' | 'failed' | 'dead'

// List jobs for a tenant
const jobs = await jobforge.listJobs(tenantId, {
  status: 'failed',
  type: SettlerJobTypes.CONTRACT_PROCESS,
  limit: 50,
})

// Get job result
if (job.result_id) {
  const result = await jobforge.getJobResult(job.result_id, tenantId)
  console.log(result.result) // Job output
}
```

### Admin Console (Minimal)

Settler exposes a minimal JobForge admin page for super admins at:

```
/admin/jobforge
```

Capabilities:
- Submit event (explicit tenant + project mapping)
- Run module (dry-run)
- View report + request bundle execution (gated by `JOBFORGE_BUNDLE_EXECUTION_ENABLED`)

### CLI (Admin)

JobForge admin actions are available in the CLI when the integration is enabled:

```bash
# Submit an event
settler admin jobforge:submit-event \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --event-name "settler.recon.event" \
  --payload '{"source":"admin","notes":"manual submit"}'

# Run module dry-run
settler admin jobforge:module:dry-run \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --module-name "reconciliation.preview" \
  --input '{"run_id":"..."}'

# View report
settler admin jobforge:report \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --job-id <uuid>

# Request bundle execution (gated)
settler admin jobforge:bundle:request \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --bundle-id <bundle> \
  --confirm
```

### Smoke Tests & Verification

Use the following commands to verify the integration end-to-end (requires
`JOBFORGE_INTEGRATION_ENABLED=true` and valid Supabase credentials):

```bash
# Dry-run a module (safe smoke test)
settler admin jobforge:module:dry-run \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --module-name "reconciliation.preview" \
  --input '{"run_id":"smoke-test"}'

# Fetch report details for a known job ID
settler admin jobforge:report \
  --tenant-id <uuid> \
  --project-id <uuid> \
  --job-id <uuid>
```

## Worker Setup

### Option 1: TypeScript Worker (Recommended for Settler)

Create a worker script in `scripts/jobforge-worker.ts`:

```typescript
import { JobForgeClient } from '@jobforge/sdk-ts'
import { createSettlerHandlers } from '@jobforge/adapter-settler'

const client = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

// Register Settler-specific job handlers
const handlers = createSettlerHandlers({
  // Add Settler-specific context (e.g., Supabase client, etc.)
  supabaseClient: client.supabase,
})

// Worker loop
async function runWorker() {
  console.log('JobForge worker started')

  while (true) {
    try {
      const jobs = await client.claimJobs('settler-worker-1', 10)

      for (const job of jobs) {
        const handler = handlers[job.type]
        if (!handler) {
          await client.completeJob(job.id, 'settler-worker-1', 'failed', {
            error: `No handler for job type: ${job.type}`,
          })
          continue
        }

        try {
          const result = await handler(job.payload)
          await client.completeJob(job.id, 'settler-worker-1', 'succeeded', null, result)
        } catch (error) {
          await client.completeJob(job.id, 'settler-worker-1', 'failed', {
            error: error.message,
            stack: error.stack,
          })
        }
      }

      // Poll interval
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Worker error:', error)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

runWorker()
```

Run the worker:

```bash
tsx scripts/jobforge-worker.ts
```

### Option 2: Python Worker

For Python-based processing:

```bash
# Install dependencies
pip install -r packages/jobforge-python-worker/requirements.txt

# Run worker
python -m jobforge_worker.cli run
```

## Job Processing Guarantees

### Idempotency

JobForge ensures jobs are not duplicated:

```typescript
// These will create only ONE job (same tenant + type + idempotency_key)
await jobforge.enqueueJob({
  tenant_id: 'tenant-123',
  type: 'contract.process',
  payload: { contractId: 'abc' },
  idempotency_key: 'contract-abc-process',
})

await jobforge.enqueueJob({
  tenant_id: 'tenant-123',
  type: 'contract.process',
  payload: { contractId: 'abc' },
  idempotency_key: 'contract-abc-process', // Same key = no duplicate
})
```

### Automatic Retries

Failed jobs are automatically retried with exponential backoff:

- Attempt 1: immediate
- Attempt 2: +1s delay
- Attempt 3: +2s delay
- Attempt 4: +4s delay
- Attempt 5: +8s delay (default max_attempts = 5)

After max attempts, jobs move to `dead` status (dead-letter queue).

### Tenant Isolation

All JobForge tables enforce Row Level Security (RLS):

```sql
-- Example RLS policy
CREATE POLICY jobforge_jobs_select_policy ON jobforge_jobs
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );
```

Workers use service role key, bypassing RLS. Client-side queries are tenant-scoped.

## Runbook

### Stuck Jobs

Jobs that don't complete will be unlocked after 5 minutes of no heartbeat:

```typescript
// Reset stuck jobs manually
await client.supabase.rpc('jobforge_reschedule_job', {
  p_job_id: jobId,
  p_tenant_id: tenantId,
  p_run_at: new Date().toISOString(),
})
```

### Dead Letter Queue

View permanently failed jobs:

```typescript
const deadJobs = await jobforge.listJobs(tenantId, {
  status: 'dead',
  limit: 100,
})

// Manually retry a dead job
await client.supabase.rpc('jobforge_reschedule_job', {
  p_job_id: deadJob.id,
  p_tenant_id: tenantId,
  p_run_at: new Date().toISOString(),
})
```

### Monitoring

```sql
-- Job queue health
SELECT status, COUNT(*) as count
FROM jobforge_jobs
GROUP BY status;

-- Failed jobs in last 24h
SELECT type, COUNT(*) as failures
FROM jobforge_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY type;

-- Average job duration by type
SELECT type, AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_seconds
FROM jobforge_jobs
WHERE status = 'succeeded'
  AND finished_at IS NOT NULL
GROUP BY type;
```

## Security Considerations

1. **Never expose service role key to client**: JobForge SDK must only be used server-side
2. **RLS enforcement**: All client queries are tenant-scoped via RLS
3. **SSRF protection**: Built-in connectors validate and sanitize URLs
4. **Webhook signing**: Outbound webhooks include HMAC signatures

## Scaling

### Horizontal Worker Scaling

Run multiple worker instances with unique IDs:

```bash
# Instance 1
WORKER_ID=settler-worker-1 tsx scripts/jobforge-worker.ts

# Instance 2
WORKER_ID=settler-worker-2 tsx scripts/jobforge-worker.ts
```

Jobs are claimed with `FOR UPDATE SKIP LOCKED`, preventing race conditions.

### Database Indexing

JobForge includes optimized indexes for:
- Job claiming: `idx_jobforge_jobs_claim`
- Status filtering: `idx_jobforge_jobs_status`
- Type filtering: `idx_jobforge_jobs_type`
- Idempotency: `idx_jobforge_jobs_idempotency`

## Documentation

- [Architecture](./jobforge/ARCHITECTURE.md) - Concurrency model, idempotency, retries
- [Runbook](./jobforge/RUNBOOK.md) - Operations, monitoring, troubleshooting
- [Security](./jobforge/SECURITY.md) - SSRF protection, webhook signing, RLS

## Package Structure

```
packages/
├── jobforge-sdk-ts/           # TypeScript SDK (server-only)
├── jobforge-adapter-settler/  # Settler-specific job types & handlers
├── jobforge-shared/           # Shared types & utilities
├── jobforge-database/         # Database utilities
├── jobforge-errors/           # Error types
├── jobforge-fetch/            # HTTP utilities with SSRF protection
└── jobforge-config/           # Shared configs
```

## Migration Details

**File:** `supabase/migrations/20260131000003_jobforge_integration.sql`

Creates:
- 4 tables with RLS enabled
- 7 RPC functions for job lifecycle
- Indexes for performance
- Triggers for `updated_at` timestamps

**Non-breaking:** Adds new schema only, no changes to existing tables.

---

**JobForge** - Boring, correct, Postgres-native job processing for Settler.
