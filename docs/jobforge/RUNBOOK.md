# JobForge Runbook

Operations guide for running JobForge in production.

## Monitoring

### Key Metrics

**Job Throughput:**

```sql
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  status,
  COUNT(*) AS count
FROM jobforge_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC;
```

**Average Processing Time:**

```sql
SELECT
  type,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) AS avg_duration_seconds,
  COUNT(*) AS count
FROM jobforge_jobs
WHERE status = 'succeeded' AND finished_at > NOW() - INTERVAL '1 day'
GROUP BY type
ORDER BY avg_duration_seconds DESC;
```

**Failure Rate:**

```sql
SELECT
  type,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'dead') AS dead,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('failed', 'dead')) / COUNT(*), 2) AS failure_rate_pct
FROM jobforge_jobs
WHERE finished_at > NOW() - INTERVAL '1 day'
GROUP BY type
ORDER BY failure_rate_pct DESC;
```

## Troubleshooting

### Stuck Jobs

**Find jobs running too long:**

```sql
SELECT id, type, tenant_id, locked_by, started_at,
       NOW() - started_at AS running_for
FROM jobforge_jobs
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '1 hour'
ORDER BY started_at ASC;
```

**Reset stuck job:**

```sql
UPDATE jobforge_jobs
SET status = 'queued',
    locked_by = NULL,
    locked_at = NULL,
    run_at = NOW()
WHERE id = 'stuck-job-uuid';
```

### Dead Letter Queue

**List dead jobs:**

```sql
SELECT id, type, tenant_id, attempts, error, created_at
FROM jobforge_jobs
WHERE status = 'dead'
ORDER BY created_at DESC
LIMIT 100;
```

**Inspect failure reasons:**

```sql
SELECT
  error->>'message' AS error_message,
  COUNT(*) AS count
FROM jobforge_jobs
WHERE status = 'dead'
GROUP BY 1
ORDER BY 2 DESC;
```

**Reschedule dead job:**

```sql
SELECT jobforge_reschedule_job(
  'job-uuid'::uuid,
  'tenant-uuid'::uuid,
  NOW()
);
```

### Worker Health

**Check worker activity:**

```sql
SELECT
  locked_by AS worker_id,
  COUNT(*) AS active_jobs,
  MAX(locked_at) AS last_claim,
  MAX(heartbeat_at) AS last_heartbeat
FROM jobforge_jobs
WHERE status = 'running'
GROUP BY locked_by
ORDER BY active_jobs DESC;
```

**Detect crashed workers (no heartbeat >5min):**

```sql
SELECT locked_by, COUNT(*)
FROM jobforge_jobs
WHERE status = 'running'
  AND heartbeat_at < NOW() - INTERVAL '5 minutes'
GROUP BY locked_by;
```

## Scaling

### Horizontal (Workers)

**Kubernetes:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jobforge-worker-ts
spec:
  replicas: 5 # Scale up/down
  template:
    spec:
      containers:
        - name: worker
          image: your-registry/jobforge-worker-ts:latest
          env:
            - name: SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: jobforge-secrets
                  key: supabase-url
```

**Docker Compose:**

```bash
docker-compose up --scale worker-ts=5 --scale worker-py=3
```

### Vertical (Database)

- Upgrade Supabase plan
- Add read replicas for analytics queries
- Partition large tables by date or tenant_id

## Maintenance

### Purge Old Jobs

```sql
-- Delete succeeded jobs older than 30 days
DELETE FROM jobforge_jobs
WHERE status = 'succeeded'
  AND finished_at < NOW() - INTERVAL '30 days';

-- Delete failed jobs older than 90 days
DELETE FROM jobforge_jobs
WHERE status IN ('failed', 'dead')
  AND finished_at < NOW() - INTERVAL '90 days';
```

**Automated cleanup (schedule as job):**

```typescript
await client.enqueueJob({
  tenant_id: 'system',
  type: 'system.cleanup.old_jobs',
  payload: { days_to_keep: 30 },
  idempotency_key: `cleanup-${new Date().toISOString().slice(0, 10)}`,
})
```

### Vacuum & Analyze

```sql
VACUUM ANALYZE jobforge_jobs;
VACUUM ANALYZE jobforge_job_results;
VACUUM ANALYZE jobforge_job_attempts;
```

## Alerts

### Recommended Alerts

1. **High Failure Rate**: >10% jobs failed in last hour
2. **Queue Backlog**: >1000 queued jobs for >5 minutes
3. **Worker Down**: No heartbeat from worker in >5 minutes
4. **Dead Letter Spike**: >100 dead jobs in last hour
5. **Slow Jobs**: Jobs running >1 hour

### Example Alert (Prometheus)

```yaml
groups:
  - name: jobforge
    rules:
      - alert: HighJobFailureRate
        expr: |
          (sum(rate(jobforge_jobs_failed_total[1h])) /
           sum(rate(jobforge_jobs_total[1h]))) > 0.1
        for: 5m
        annotations:
          summary: 'High job failure rate ({{ $value }}%)'
```

## Backfills

### Reprocess Failed Jobs

```sql
-- Reset failed jobs to queued for specific type
UPDATE jobforge_jobs
SET status = 'queued',
    run_at = NOW(),
    locked_by = NULL,
    locked_at = NULL,
    attempts = 0
WHERE status = 'failed'
  AND type = 'connector.http.request'
  AND created_at > NOW() - INTERVAL '1 day';
```

### Bulk Enqueue

```typescript
const jobs = []
for (const item of items) {
  jobs.push(
    client.enqueueJob({
      tenant_id: tenantId,
      type: 'backfill.process_item',
      payload: { item_id: item.id },
      idempotency_key: `backfill-${item.id}`,
    })
  )
}

await Promise.all(jobs)
```

## Disaster Recovery

### Database Backup

Supabase provides automated backups. For manual backup:

```bash
pg_dump -h db.project.supabase.co \
  -U postgres \
  -t jobforge_jobs \
  -t jobforge_job_results \
  -t jobforge_job_attempts \
  -t jobforge_connector_configs \
  -F c -f jobforge_backup.dump
```

### Restore

```bash
pg_restore -h db.project.supabase.co \
  -U postgres \
  -d postgres \
  jobforge_backup.dump
```

## Performance Tuning

### Optimize Claim Query

```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM jobforge_jobs
WHERE status = 'queued' AND run_at <= NOW()
ORDER BY run_at ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;

-- Ensure index is used
-- Should see "Index Scan using idx_jobforge_jobs_claim"
```

### Connection Pooling

Use pgBouncer or Supavisor:

```
# Supabase connection pooler
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Payload Optimization

Store large payloads externally:

```typescript
// Instead of:
await client.enqueueJob({
  payload: { large_data: hugeObject }, // Bad: >100KB
})

// Do this:
const ref = await uploadToStorage(hugeObject)
await client.enqueueJob({
  payload: { data_ref: ref }, // Good: small payload
})
```

---

For more details, see:

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [SECURITY.md](SECURITY.md) - Security considerations
