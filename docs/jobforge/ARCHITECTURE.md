# JobForge Architecture

This document describes JobForge's design, concurrency model, and key invariants.

## Design Philosophy

1. **Postgres is the Truth Layer** - All job state lives in Postgres; no external queues
2. **Multi-Tenant by Default** - Strict tenant isolation via RLS
3. **RPC-Based Mutations** - All writes via RPC functions, never direct SQL
4. **Idempotency First** - Safe to retry, safe to run multiple times
5. **Least Privilege** - No service role on clients; workers use RPC with checks
6. **Observability Built-In** - Structured logs, correlation IDs, timestamps

## System Components

### 1. Database Layer (Postgres/Supabase)

**Tables:**

- `jobforge_jobs` - Job queue with status, payload, locking fields
- `jobforge_job_results` - Execution results storage
- `jobforge_job_attempts` - Attempt history for debugging
- `jobforge_connector_configs` - Tenant connector configurations

**RPC Functions:**

- `jobforge_enqueue_job()` - Enqueue with idempotency
- `jobforge_claim_jobs()` - Claim jobs for processing (concurrency-safe)
- `jobforge_heartbeat_job()` - Update heartbeat timestamp
- `jobforge_complete_job()` - Complete with retry/dead-letter logic
- `jobforge_cancel_job()` - Cancel queued jobs
- `jobforge_reschedule_job()` - Reschedule failed/queued jobs
- `jobforge_list_jobs()` - List jobs with filters

**RLS Policies:**

- Tenants can SELECT their own jobs only
- INSERT/UPDATE/DELETE blocked (use RPC)
- Cross-tenant reads prevented via `app.tenant_id` setting

### 2. SDK Layer

**TypeScript SDK (`@jobforge/sdk-ts`):**

- Server-only client (never expose service keys)
- Wraps Supabase RPC calls
- Type-safe with Zod validation

**Python SDK (`@jobforge/sdk-py`):**

- Pydantic models for payloads/results
- HTTP client calling Supabase REST API
- Strict env validation via pydantic-settings

### 3. Worker Layer

**TypeScript Worker:**

- Polls `claim_jobs` RPC
- Handler registry (Map<jobType, handler>)
- Heartbeat loop for long jobs
- Graceful shutdown (SIGINT/SIGTERM)
- Structured JSON logs

**Python Worker:**

- Equivalent behavior to TS worker
- asyncio for concurrency
- No native dependencies (Termux-friendly)

### 4. Connector Layer

Built-in job handlers:

- `connector.http.request` - HTTP with SSRF protection
- `connector.webhook.deliver` - Webhook with HMAC signing
- `connector.report.generate` - Report generation (JSON/HTML/CSV)

## Concurrency Model

### Job Claiming (FOR UPDATE SKIP LOCKED)

```sql
UPDATE jobforge_jobs
SET status = 'running', locked_by = p_worker_id, ...
WHERE id IN (
  SELECT id FROM jobforge_jobs
  WHERE status = 'queued' AND run_at <= NOW()
  ORDER BY run_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED  -- Key: prevents race conditions
)
RETURNING *;
```

**Why SKIP LOCKED?**

- Multiple workers can claim jobs concurrently without blocking
- Each worker gets different jobs (no duplicates)
- No race conditions even with 100+ workers

### Worker Lock Ownership

All job mutations verify `locked_by` matches the worker:

```sql
UPDATE jobforge_jobs
SET heartbeat_at = NOW()
WHERE id = p_job_id
  AND locked_by = p_worker_id  -- Prevents worker from modifying another's job
  AND status = 'running';
```

### Heartbeat Mechanism

- Workers send heartbeat every 30s (configurable)
- Stale jobs (no heartbeat >5min) can be reclaimed
- Prevents lost work from crashed workers

## Idempotency

### Deduplication

Jobs with same `(tenant_id, type, idempotency_key)` are deduplicated:

```sql
INSERT INTO jobforge_jobs (...)
VALUES (...)
ON CONFLICT (tenant_id, type, idempotency_key)
WHERE idempotency_key IS NOT NULL
DO UPDATE SET updated_at = NOW()  -- No-op, returns existing
RETURNING *;
```

**Use Cases:**

- Webhook delivery: `idempotency_key = "webhook-{event_id}"`
- Contract processing: `idempotency_key = "process-{contract_id}"`
- Report generation: `idempotency_key = "report-{tenant_id}-{month}"`

### Handler Idempotency

Handlers should be idempotent (safe to retry):

- Use external idempotency keys when calling APIs
- Store results in database with unique constraints
- Avoid side effects in validation logic

## Retry Logic & Backoff

### Automatic Retries

Failed jobs are automatically retried with exponential backoff:

```
Attempt 1: immediate
Attempt 2: +1s
Attempt 3: +2s
Attempt 4: +4s
Attempt 5: +8s
...
Max backoff: 3600s (1 hour)
```

Implementation in `jobforge_complete_job()`:

```sql
v_backoff_seconds := LEAST(POWER(2, v_job.attempts - 1)::INT, 3600);

UPDATE jobforge_jobs
SET status = 'queued',
    run_at = NOW() + (v_backoff_seconds || ' seconds')::INTERVAL
WHERE id = p_job_id;
```

### Dead Letter Queue

After `max_attempts` (default 5), jobs move to `dead` status:

```sql
IF v_job.attempts >= v_job.max_attempts THEN
  UPDATE jobforge_jobs SET status = 'dead', finished_at = NOW()
  WHERE id = p_job_id;
END IF;
```

**Recovery Options:**

1. Reschedule via `jobforge_reschedule_job()`
2. Increase `max_attempts` and reschedule
3. Fix issue and manually reset to `queued`

## Status Transitions

```
           ┌─────────┐
           │ queued  │ ◄────┐
           └────┬────┘      │
                │           │ (retry with backoff)
           ┌────▼────┐      │
           │ running │──────┤
           └────┬────┘      │
                │           │
        ┌───────┴───────┐   │
        │               │   │
   ┌────▼────┐    ┌─────▼───▼──┐
   │succeeded│    │   failed    │
   └─────────┘    └──────┬──────┘
                         │
                   (max attempts)
                         │
                   ┌─────▼────┐
                   │   dead   │
                   └──────────┘

  canceled ◄─── (user action)
```

## Multi-Tenancy

### Tenant Isolation

All tables have `tenant_id UUID NOT NULL`:

```sql
CREATE TABLE jobforge_jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- Always present
  ...
);
```

### RLS Enforcement

```sql
CREATE POLICY jobforge_jobs_select_policy ON jobforge_jobs
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );
```

**Client Usage:**

```typescript
// Set tenant context before querying
await supabase.rpc('set_config', {
  setting: 'app.tenant_id',
  value: tenantId,
  is_local: true,
})

// Now queries only see tenant's data
const { data } = await supabase.from('jobforge_jobs').select('*')
```

### RPC Tenant Validation

All RPC functions validate `p_tenant_id` parameter:

```sql
CREATE FUNCTION jobforge_enqueue_job(p_tenant_id UUID, ...)
...
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;

  INSERT INTO jobforge_jobs (tenant_id, ...) VALUES (p_tenant_id, ...);
END;
```

## Observability

### Structured Logging

All logs are JSON with consistent fields:

```json
{
  "timestamp": "2025-01-31T10:30:45.123Z",
  "level": "info",
  "worker_id": "worker-ts-1",
  "trace_id": "abc123...",
  "job_id": "def456...",
  "job_type": "connector.http.request",
  "tenant_id": "tenant-uuid",
  "attempt_no": 2,
  "message": "Job succeeded",
  "duration_ms": 1234
}
```

### Correlation IDs

- `trace_id` generated per job execution
- Passed through all logs and external calls
- Enables end-to-end request tracing

### Attempt History

`jobforge_job_attempts` table records every execution:

```sql
SELECT * FROM jobforge_job_attempts
WHERE job_id = 'job-uuid'
ORDER BY attempt_no DESC;
```

Shows:

- When each attempt started/finished
- Error details for failed attempts
- Useful for debugging retry behavior

## Scaling Strategies

### Horizontal Scaling (Workers)

- Run multiple worker instances
- `FOR UPDATE SKIP LOCKED` prevents conflicts
- Each worker claims different jobs
- No coordination needed

**Deployment:**

```bash
# Kubernetes: scale replicas
kubectl scale deployment worker-ts --replicas=5

# Docker Compose: scale service
docker-compose up --scale worker=5
```

### Vertical Scaling (Database)

- Add indexes for hot queries:
  - `(tenant_id, status, run_at)` for claiming
  - `(tenant_id, type, idempotency_key)` for dedup
- Use connection pooling (Supavisor, pgBouncer)
- Partition large tables by `tenant_id` or `created_at`

### Job Prioritization

Add priority field and modify claim query:

```sql
ORDER BY priority DESC, run_at ASC
```

### Rate Limiting

Limit jobs per tenant using RPC:

```sql
-- In enqueue_job
SELECT COUNT(*) INTO v_pending
FROM jobforge_jobs
WHERE tenant_id = p_tenant_id AND status IN ('queued', 'running');

IF v_pending > 1000 THEN
  RAISE EXCEPTION 'Job limit exceeded for tenant';
END IF;
```

## Performance Considerations

### Index Strategy

```sql
-- Critical: job claiming
CREATE INDEX idx_jobforge_jobs_claim
  ON jobforge_jobs (tenant_id, status, run_at)
  WHERE status = 'queued';

-- Idempotency lookups
CREATE UNIQUE INDEX idx_jobforge_jobs_idempotency
  ON jobforge_jobs (tenant_id, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Locked job tracking
CREATE INDEX idx_jobforge_jobs_locked
  ON jobforge_jobs (locked_at, locked_by)
  WHERE locked_at IS NOT NULL;
```

### Payload Size

- Store large payloads in object storage (S3, Supabase Storage)
- Reference via `artifact_ref` field
- Keeps database lean and fast

### Batching

Claim multiple jobs per poll:

```typescript
const jobs = await client.claimJobs({
  worker_id: workerId,
  limit: 10, // Process 10 jobs concurrently
})
```

## Security Model

See [SECURITY.md](SECURITY.md) for detailed security considerations:

- SSRF protection (HTTP connector)
- Webhook HMAC signing
- Secret management (env vars, not DB)
- RLS tenant isolation
- Least privilege (no service role on clients)

## Future Enhancements

Potential additions (not in v1):

1. **Scheduled Jobs** - Cron-like recurring jobs
2. **Job Dependencies** - Workflows (job chains)
3. **Priority Queues** - Urgent vs background jobs
4. **Rate Limiting** - Per-tenant job limits
5. **Webhooks** - Notify on job completion
6. **Dashboard** - Admin UI for job monitoring
7. **Metrics** - Prometheus/OpenTelemetry exports

---

**Design Principle**: Keep it simple, boring, and correct. Add complexity only when needed.
