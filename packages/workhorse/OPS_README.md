# Workhorse Operations Guide

This document covers deployment, operations, and runbooks for the Settler Python Workhorse (batch job worker).

## Overview

The Workhorse is a Python-based background job processor that handles:

- CSV/JSON ingestion
- Report generation (PDF, Excel)
- ML-based reconciliation scoring
- Batch data processing

It runs **separately** from the main Vercel deployment and connects to the same PostgreSQL database.

---

## Environment Variables

### Required

| Variable                 | Description                        | Example                                |
| ------------------------ | ---------------------------------- | -------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string       | `postgresql://user:pass@host:5432/db`  |
| `WORKHORSE_DATABASE_URL` | Override for workhorse-specific DB | Same as above                          |
| `WORKHORSE_ENVIRONMENT`  | Runtime environment                | `production`, `staging`, `development` |

### Optional (with defaults)

| Variable                                 | Default        | Description              |
| ---------------------------------------- | -------------- | ------------------------ |
| `WORKHORSE_WORKER_ID`                    | `hostname-pid` | Unique worker identifier |
| `WORKHORSE_WORKER_POLL_INTERVAL_SECONDS` | `5`            | Polling frequency        |
| `WORKHORSE_WORKER_LOCK_TIMEOUT_SECONDS`  | `300`          | Job lock timeout         |
| `WORKHORSE_WORKER_MAX_JOBS`              | `100`          | Max concurrent jobs      |
| `WORKHORSE_RETRY_MAX_ATTEMPTS`           | `3`            | Max retry attempts       |
| `WORKHORSE_RETRY_BACKOFF_BASE_SECONDS`   | `1.0`          | Initial retry delay      |
| `WORKHORSE_LOG_LEVEL`                    | `INFO`         | Logging level            |
| `WORKHORSE_ENABLE_METRICS`               | `true`         | Prometheus metrics       |
| `WORKHORSE_METRICS_PORT`                 | `9090`         | Metrics endpoint port    |

### Feature Flags

| Variable                             | Default | Description                      |
| ------------------------------------ | ------- | -------------------------------- |
| `WORKHORSE_ENABLE_CSV_INGESTION`     | `true`  | Enable CSV processing            |
| `WORKHORSE_ENABLE_JSON_INGESTION`    | `true`  | Enable JSON processing           |
| `WORKHORSE_ENABLE_PDF_REPORTS`       | `true`  | Enable PDF generation            |
| `WORKHORSE_ENABLE_EXCEL_EXPORTS`     | `true`  | Enable Excel export              |
| `WORKHORSE_ENABLE_ANOMALY_DETECTION` | `true`  | Enable ML anomaly detection      |
| `WORKHORSE_ENABLE_ML_SCORING`        | `true`  | Enable ML reconciliation scoring |

---

## Deployment Strategy

We recommend **separate container/VM deployment** as the least intrusive option.

### Option 1: Separate Container (Recommended)

Deploy the worker as a standalone container alongside your existing infrastructure.

**Pros:**

- No changes to Vercel deployment
- Independent scaling
- Isolated resource usage
- Easy rollback

**Platforms:**

- **Fly.io** (simpler, good for moderate load)
- **Railway** (easy deploy from GitHub)
- **AWS ECS/Fargate** (enterprise scale)
- **Google Cloud Run** (serverless containers)

**Example: Fly.io Deployment**

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Create app (one-time)
cd packages/workhorse
fly apps create settler-workhorse

# 3. Deploy
fly deploy --dockerfile Dockerfile

# 4. Set secrets
fly secrets set DATABASE_URL="your-db-url"
fly secrets set WORKHORSE_ENVIRONMENT="production"
```

### Option 2: Managed Worker Platform

Use a managed background job service.

**Platforms:**

- **Render** (Background Workers)
- **Railway** (cron + worker services)
- **Heroku** (Worker dynos)

**Example: Render**

```yaml
# render.yaml
services:
  - type: worker
    name: settler-workhorse
    runtime: docker
    dockerfilePath: packages/workhorse/Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: settler-db
          property: connectionString
      - key: WORKHORSE_ENVIRONMENT
        value: production
```

### Option 3: GitHub Actions Scheduled Runner

For non-critical, scheduled jobs only (not recommended for real-time processing).

```yaml
# .github/workflows/worker-scheduled.yml
name: Scheduled Worker
on:
  schedule:
    - cron: "*/5 * * * *" # Every 5 minutes
jobs:
  worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: |
          cd packages/workhorse
          pip install -e "."
          python -m settler_workhorse.cli worker --max-jobs 10
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

⚠️ **Caution:** GitHub Actions has 6-hour job limits and may queue jobs during high usage.

---

## Rollout Steps

### Initial Deployment

1. **Database Preparation**

   ```bash
   # Apply migrations (if not already applied)
   supabase db push
   # Or apply specific workhorse migrations
   psql $DATABASE_URL -f supabase/migrations/20250130000001_python_workhorse_tables.sql
   psql $DATABASE_URL -f supabase/migrations/20250131000000_job_queue_rls.sql
   ```

2. **Verify Database Connection**

   ```bash
   pnpm workhorse:health
   ```

3. **Smoke Test**

   ```bash
   pnpm jobs:smoke
   ```

4. **Deploy Worker**

   ```bash
   # Build and push container
   docker build -t settler-workhorse packages/workhorse
   docker push your-registry/settler-workhorse:latest

   # Deploy to your platform
   # (Platform-specific commands)
   ```

5. **Verify Deployment**

   ```bash
   # Check health endpoint
   curl http://worker-host:9090/metrics

   # Check logs
   fly logs  # or platform-specific
   ```

### Rolling Updates

For zero-downtime updates:

1. **Deploy New Version**

   ```bash
   fly deploy --strategy rolling
   ```

2. **Monitor During Rollout**

   ```bash
   # Watch error rates
   fly logs --follow

   # Check metrics
   curl http://worker-host:9090/metrics
   ```

3. **Rollback if Needed**
   ```bash
   fly releases list
   fly rollback vNN
   ```

---

## Monitoring and Alerts

### Health Checks

The worker exposes a health endpoint:

```bash
# Check worker health
settler-worker health

# Or via HTTP (if enabled)
curl http://worker-host:9090/health
```

### Prometheus Metrics

Metrics available at `:9090/metrics`:

- `workhorse_jobs_processed_total` - Total jobs processed
- `workhorse_jobs_failed_total` - Total job failures
- `workhorse_jobs_duration_seconds` - Job processing duration
- `workhorse_worker_poll_interval_seconds` - Poll interval
- `workhorse_db_connection_pool_size` - DB pool size

### Recommended Alerting Rules

```yaml
# High job failure rate
- alert: WorkhorseHighFailureRate
  expr: rate(workhorse_jobs_failed_total[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High job failure rate detected"

# Worker down
- alert: WorkhorseDown
  expr: up{job="workhorse"} == 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Workhorse worker is down"

# Long processing queue
- alert: WorkhorseQueueBacklog
  expr: workhorse_jobs_pending > 100
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Job queue backlog detected"
```

### Webhook Alerts

Configure webhooks for:

- **Slack:** Job failures, worker restarts
- **PagerDuty:** Critical alerts (worker down)
- **Email:** Daily summary reports

---

## Runbooks

### R1: Worker Not Processing Jobs

**Symptoms:**

- Jobs stuck in `queued` status
- No log activity
- Metrics show no job processing

**Steps:**

1. Check worker health:

   ```bash
   pnpm workhorse:health
   ```

2. Check database connection:

   ```bash
   # Verify connection string
   echo $DATABASE_URL

   # Test connection
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM python_jobs WHERE status = 'queued';"
   ```

3. Check worker logs:

   ```bash
   fly logs --follow  # or platform equivalent
   ```

4. Restart worker:

   ```bash
   fly restart  # or platform equivalent
   ```

5. If still failing, check for locks:

   ```sql
   -- Check for stuck locks
   SELECT * FROM python_jobs
   WHERE status = 'processing'
   AND locked_at < NOW() - INTERVAL '1 hour';

   -- Release stuck locks (use with caution)
   UPDATE python_jobs
   SET status = 'queued', locked_by = NULL, locked_at = NULL
   WHERE status = 'processing'
   AND locked_at < NOW() - INTERVAL '1 hour';
   ```

### R2: High Job Failure Rate

**Symptoms:**

- Alert firing for failure rate
- Many jobs in `failed` status
- Error logs show exceptions

**Steps:**

1. Check recent failures:

   ```bash
   cd packages/workhorse
   python -m settler_workhorse.cli maintenance --show-failures --limit 10
   ```

2. View error details:

   ```sql
   SELECT id, job_type, error_message, error_stack, failed_at
   FROM python_jobs
   WHERE status = 'failed'
   ORDER BY failed_at DESC
   LIMIT 10;
   ```

3. Check for common patterns:
   - Same job type failing?
   - Database connection issues?
   - Memory/CPU limits?

4. If needed, pause processing:

   ```bash
   # Scale worker to 0
   fly scale count 0

   # Fix issue
   # ...

   # Resume
   fly scale count 1
   ```

### R3: Database Connection Issues

**Symptoms:**

- Connection timeout errors
- "too many connections" errors
- Slow job processing

**Steps:**

1. Check current connections:

   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```

2. Check for idle connections:

   ```sql
   SELECT pid, state, query_start, query
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND query_start < NOW() - INTERVAL '1 hour';
   ```

3. Restart worker (will reset connection pool):

   ```bash
   fly restart
   ```

4. Adjust pool size if needed:
   ```bash
   fly secrets set WORKHORSE_DB_POOL_SIZE=5  # Default is 10
   ```

### R4: Worker Memory/CPU Issues

**Symptoms:**

- OOM kills
- High CPU usage
- Slow processing

**Steps:**

1. Check resource usage:

   ```bash
   fly status  # or platform equivalent
   ```

2. For memory issues:
   - Reduce `WORKHORSE_WORKER_MAX_JOBS` (default 100)
   - Scale up container memory
   - Check for memory leaks in custom handlers

3. For CPU issues:
   - Scale horizontally (add more workers)
   - Check for inefficient queries
   - Profile job handlers

### R5: Failed Migration

**Symptoms:**

- Worker won't start
- Database errors on startup
- Missing tables

**Steps:**

1. Check migration status:

   ```bash
   supabase migration list
   ```

2. Apply pending migrations:

   ```bash
   supabase db push
   ```

3. If specific workhorse tables missing:

   ```bash
   psql $DATABASE_URL -f supabase/migrations/20250130000001_python_workhorse_tables.sql
   psql $DATABASE_URL -f supabase/migrations/20250131000000_job_queue_rls.sql
   ```

4. Verify tables exist:
   ```sql
   \dt python_jobs
   ```

---

## Development Commands

### Local Development

```bash
# Start dependencies
cd packages/workhorse
docker-compose up -d postgres redis

# Install workhorse
pnpm workhorse:install

# Run worker locally
pnpm worker:py

# Or with custom settings
DATABASE_URL=postgresql://settler:settler_dev_password@localhost:5432/settler_dev \
  pnpm worker:py

# Run smoke tests
pnpm jobs:smoke

# Run Python tests
pnpm workhorse:test
```

### Maintenance Tasks

```bash
# View job queue status
pnpm workhorse:health

# Enqueue a test job
pnpm workhorse:enqueue --type csv_ingestion --payload '{"test": true}'

# Run maintenance (cleanup, retry failed jobs)
pnpm workhorse:maintenance

# Format and lint Python code
pnpm workhorse:format
pnpm workhorse:lint
```

---

## Architecture Notes

### Tenant Isolation

The workhorse enforces tenant isolation via:

1. **RLS Policies:** Database-level enforcement
2. **Worker Context:** Jobs include tenant_id and handler validates it
3. **Separate Schemas:** Each tenant's data is logically separated

### Job Lifecycle

```
queued → processing → (completed | failed)
                    ↓
                  retry (if failed && attempts < max)
                    ↓
              dead_letter (if max retries exceeded)
```

### Concurrency Model

- **Polling:** Workers poll database for new jobs
- **Locking:** Jobs are locked during processing (prevents duplicate processing)
- **Multiple Workers:** Can run multiple worker instances for horizontal scaling
- **Lease Timeout:** Locks expire after timeout (prevents stuck jobs)

---

## Troubleshooting Checklist

- [ ] Database URL is correct and accessible
- [ ] Migrations are applied
- [ ] RLS policies are in place
- [ ] Worker can connect to database (test with `workhorse:health`)
- [ ] Worker has appropriate feature flags enabled
- [ ] Resource limits (memory/CPU) are adequate
- [ ] Logs show no connection errors
- [ ] Metrics endpoint is accessible (port 9090)
- [ ] No firewall blocking database port
- [ ] Database has sufficient connection pool slots

---

## Support

For issues:

1. Check this runbook
2. Review logs: `fly logs` or platform equivalent
3. Check metrics: `curl :9090/metrics`
4. Run smoke tests: `pnpm jobs:smoke`
5. Escalate to engineering team
