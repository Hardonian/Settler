# Operations Runbook: Background Maintenance Jobs

This runbook covers the monitoring, querying, and troubleshooting of Settler's core background resilience jobs:

1. **Stale Run Reaper** (`settler-stale-run-reaper`)
2. **Archival Sweeper** (`settler-archival-sweeper`)

---

## 1. Kubernetes Monitoring & Management

Both jobs are deployed as Kubernetes `CronJobs` in the `settler-backend` namespace.

### Check Job Schedules & Status

View the active schedules and the last time they ran:

```bash
kubectl get cronjobs -n settler-backend
```

### View Recent Executions

Kubernetes retains the history of the last 3 successful and failed jobs.

```bash
kubectl get jobs -n settler-backend | grep -E 'reaper|archiver'
```

### Inspect Logs

To see the output of the most recent Archival Sweeper run:

```bash
# 1. Find the latest job pod
POD_NAME=$(kubectl get pods -n settler-backend --selector=job-name=<INSERT_JOB_NAME_FROM_ABOVE> --output=jsonpath='{.items[0].metadata.name}')

# 2. Fetch logs
kubectl logs $POD_NAME -n settler-backend
```

### Manually Trigger a Job Out-of-Schedule

If you need to force an immediate sweep (e.g., right after a known worker outage):

```bash
kubectl create job --from=cronjob/settler-stale-run-reaper manual-reaper-run-001 -n settler-backend
```

---

## 2. Database Queries & Verification

You can query the PostgreSQL database directly to verify the jobs are working as expected.

### Verify the Reaper

Check if there are any runs currently stuck in `Processing` that _should_ have been caught by the reaper (if this returns rows, the reaper is failing):

```sql
SELECT id, tenant_id, created_at, status
FROM public.runs
WHERE status = 'Processing'
  AND created_at < NOW() - INTERVAL '65 minutes';
```

Check how many runs the reaper has successfully caught and transitioned today:

```sql
SELECT trace_id, details, created_at
FROM public.audit_logs
WHERE action = 'SYSTEM_RECOVERY'
  AND created_at > CURRENT_DATE;
```

### Verify the Archiver

Check if there is data bypassing the archival boundary (if this returns rows, the archiver is falling behind or failing):

```sql
SELECT count(*), status
FROM public.runs
WHERE status IN ('Completed', 'Completed with Exceptions', 'Failed', 'Failed - Timed Out')
  AND created_at < NOW() - INTERVAL '31 days'
GROUP BY status;
```

View the recent bulk-archival audit trails:

```sql
SELECT created_at, details, array_length(batch_entity_ids, 1) as runs_archived
FROM public.audit_logs
WHERE action = 'RUNS_ARCHIVED_TO_COLD_STORAGE'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 3. Alerts & Thresholds (Datadog / Prometheus)

We recommend setting up the following monitors in your observability stack:

1. **Reaper Failure Alert**:
   - **Query**: `sum:kubernetes_state.job.failed{job_name:settler-stale-run-reaper}`
   - **Threshold**: `> 0`
2. **Zombie Run Alert**:
   - **Query**: Custom SQL metric counting rows from the Reaper verification query above.
   - **Threshold**: `> 10` (Indicates the reaper is not running or is crashing mid-execution).
3. **Archiver OOM (Out of Memory)**:
   - **Query**: `kubernetes.memory.usage` for the `settler-archival-sweeper` container.
   - **Threshold**: If it hits the 512Mi limit, you must lower the `ARCHIVE_BATCH_SIZE` environment variable or increase the K8s memory limit.
