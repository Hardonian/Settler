# Settler Workhorse

Python batch processing subsystem for Settler - handling data ingestion, reporting, ML scoring, and long-running reconciliation tasks.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The Workhorse is a **non-breaking, additive** Python subsystem that extends Settler's TypeScript/Next.js stack with robust batch processing capabilities:

- **CSV/JSON ingestion** with pandas-based parsing, encoding detection, and robust date parsing
- **Report generation** (PDF, Excel) with charts and professional formatting
- **ML-based scoring** for reconciliation matching and anomaly detection
- **Long-running batch jobs** that don't fit serverless constraints

### Key Features

- **Multi-tenant Isolation** - Row-level security (RLS) enforced at database level
- **Reliable Processing** - Exponential backoff retries, dead letter queue for failed jobs
- **Observability** - Structured logging with correlation IDs, Prometheus metrics, OpenTelemetry
- **Scalability** - Connection pooling, configurable concurrency, graceful shutdown
- **Data Quality** - Robust CSV parsing with encoding detection, date normalization, amount standardization

### System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js (TS)   │────▶│  Supabase/Postgres│────▶│  Python Worker  │
│                 │     │   python_jobs     │     │   (polling)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       │                                                    │
       │              ┌──────────────────┐                  │
       └─────────────▶│  RLS Policies    │◀─────────────────┘
                      │  (tenant_id)     │
                      └──────────────────┘
```

**Key Principles:**

- **Non-breaking**: Existing app runs unchanged
- **RLS-compliant**: Uses same tenant isolation as TypeScript code
- **Graceful degradation**: Jobs queue if worker offline
- **Deterministic**: Typed env, structured logs, idempotency

## Installation

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 14+ (or Supabase)
- pip or uv package manager

### Setup

```bash
cd packages/workhorse

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install with development dependencies
pip install -e ".[dev]"

# Or install all optional extras (dev + ml + reports)
pip install -e ".[all]"
```

### Alternative: Install Specific Extras

```bash
# Core + ML dependencies only
pip install -e ".[dev,ml]"

# Core + Report generation only
pip install -e ".[dev,reports]"
```

## Configuration

Workhorse uses environment variables with the `WORKHORSE_` prefix. Create a `.env` file or set variables directly:

### Required Environment Variables

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/settler

# Optional: Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Worker Configuration

| Variable                                 | Default        | Description                      |
| ---------------------------------------- | -------------- | -------------------------------- |
| `WORKHORSE_WORKER_ID`                    | Auto-generated | Unique worker identifier         |
| `WORKHORSE_WORKER_POLL_INTERVAL_SECONDS` | 5.0            | Seconds between queue polls      |
| `WORKHORSE_WORKER_MAX_JOBS`              | 100            | Max jobs before auto-shutdown    |
| `WORKHORSE_WORKER_LOCK_TIMEOUT_SECONDS`  | 300            | Lock expiration time             |
| `WORKHORSE_WORKER_CONCURRENCY`           | 1              | Concurrent job processing (1-10) |

### Retry Configuration

| Variable                               | Default | Description                      |
| -------------------------------------- | ------- | -------------------------------- |
| `WORKHORSE_RETRY_MAX_ATTEMPTS`         | 3       | Maximum retry attempts per job   |
| `WORKHORSE_RETRY_BACKOFF_BASE_SECONDS` | 1.0     | Initial backoff delay            |
| `WORKHORSE_RETRY_BACKOFF_MAX_SECONDS`  | 300.0   | Maximum backoff delay            |
| `WORKHORSE_RETRY_BACKOFF_MULTIPLIER`   | 2.0     | Backoff multiplier (exponential) |

### Feature Flags

```bash
# Enable specific job handlers
WORKHORSE_ENABLE_CSV_INGESTION=true
WORKHORSE_ENABLE_JSON_INGESTION=true
WORKHORSE_ENABLE_PDF_REPORTS=true
WORKHORSE_ENABLE_EXCEL_EXPORTS=true
WORKHORSE_ENABLE_ANOMALY_DETECTION=false
WORKHORSE_ENABLE_ML_SCORING=false
```

### Storage Configuration

```bash
# Storage backend: local, s3, or r2
WORKHORSE_STORAGE_TYPE=local
WORKHORSE_STORAGE_LOCAL_PATH=./storage

# S3 settings (if using s3)
WORKHORSE_STORAGE_S3_BUCKET=settler-uploads
WORKHORSE_STORAGE_S3_REGION=us-east-1
WORKHORSE_STORAGE_S3_ACCESS_KEY=xxx
WORKHORSE_STORAGE_S3_SECRET_KEY=xxx

# R2 settings (if using Cloudflare R2)
WORKHORSE_STORAGE_R2_ACCOUNT_ID=xxx
WORKHORSE_STORAGE_R2_BUCKET=settler-uploads
```

### Observability

```bash
# Logging
WORKHORSE_LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
WORKHORSE_DEBUG=false

# Metrics
WORKHORSE_ENABLE_METRICS=true
WORKHORSE_METRICS_PORT=9090

# OpenTelemetry
WORKHORSE_ENABLE_OPENTELEMETRY=false
WORKHORSE_OTEL_ENDPOINT=http://localhost:4317
WORKHORSE_OTEL_SERVICE_NAME=settler-workhorse
```

### Complete .env Example

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/settler
SUPABASE_URL=https://xyz123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

WORKHORSE_WORKER_ID=production-worker-1
WORKHORSE_LOG_LEVEL=INFO
WORKHORSE_WORKER_POLL_INTERVAL_SECONDS=5.0
WORKHORSE_ENABLE_CSV_INGESTION=true
WORKHORSE_ENABLE_JSON_INGESTION=true
WORKHORSE_ENABLE_PDF_REPORTS=true
WORKHORSE_ENABLE_EXCEL_EXPORTS=true

WORKHORSE_STORAGE_TYPE=local
WORKHORSE_STORAGE_LOCAL_PATH=/var/lib/settler/storage

WORKHORSE_ENABLE_METRICS=true
WORKHORSE_METRICS_PORT=9090
```

## Usage

### Running the Worker

Start the background worker to process jobs from the queue:

```bash
# Start worker with default settings
settler-worker worker

# Start with custom worker ID and poll interval
settler-worker --debug worker --worker-id=worker-01 --poll-interval=2.0

# Process a limited number of jobs then exit
settler-worker worker --max-jobs=10
```

### Enqueueing Jobs via CLI

Manually enqueue jobs (useful for testing or admin tasks):

```bash
# Enqueue a CSV ingestion job
settler-worker enqueue \
  --tenant-id="550e8400-e29b-41d4-a716-446655440000" \
  --job-type="csv_ingestion" \
  --payload='{"file_path": "/uploads/data.csv", "default_currency": "USD"}' \
  --priority=10

# Enqueue with idempotency key for safe retries
settler-worker enqueue \
  --tenant-id="550e8400-e29b-41d4-a716-446655440000" \
  --job-type="pdf_report" \
  --payload='{"report_type": "daily", "date_range": "last_7_days"}' \
  --idempotency-key="daily-report-2024-01-15"
```

### Enqueueing Jobs via TypeScript

```typescript
import { enqueuePythonJob, enqueueCSVIngestion } from "@/lib/python-jobs";

// Enqueue CSV ingestion
const result = await enqueueCSVIngestion(fileBase64, {
  columnMapping: { amount: "Total", date: "Date" },
  priority: 10,
});

if (result.success) {
  console.log(`Job enqueued: ${result.job?.id}`);
}
```

### Programmatic Usage (Python)

```python
from uuid import UUID
from settler_workhorse.db import JobRepository, create_connection_pool
from settler_workhorse.models import JobEnqueueRequest, JobType
from settler_workhorse.config import get_settings

# Initialize
settings = get_settings()
pool = create_connection_pool(settings)
job_repo = JobRepository(pool, settings)

# Enqueue a job
request = JobEnqueueRequest(
    job_type=JobType.CSV_INGESTION,
    payload={
        "file_path": "/uploads/transactions.csv",
        "column_mapping": {"amount": "Amount", "date": "Date"},
        "default_currency": "USD"
    },
    priority=10,
    idempotency_key="import-2024-01-15"
)

job = job_repo.enqueue(
    tenant_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
    request=request
)

print(f"Job enqueued: {job.id}")
```

### Health Check

Verify database connectivity and queue status:

```bash
settler-worker health
```

Output:

```
✓ Database connection: OK
✓ Job queue: 5 queued, 2 running
✓ Total jobs: 152

Health check passed ✓
```

### Maintenance

Release stale locks and view queue statistics:

```bash
# Release locks from crashed workers
settler-worker maintenance --release-stale --lock-timeout=300

# View queue stats
settler-worker maintenance
```

## Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/settlerdev/settler.git
cd settler/packages/workhorse
pip install -e ".[all]"
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=settler_workhorse --cov-report=html

# Run specific test markers
pytest -m unit
pytest -m integration
pytest -m "not slow"
```

### 4. Code Quality

```bash
# Format code
black src/ tests/

# Lint with ruff
ruff check src/ tests/
ruff check --fix src/ tests/

# Type check
mypy src/settler_workhorse

# Run pre-commit hooks
pre-commit run --all-files
```

### 5. Run Worker in Development

```bash
# Terminal 1: Start worker
settler-worker --debug worker

# Terminal 2: Enqueue a test job
settler-worker enqueue \
  --tenant-id="00000000-0000-0000-0000-000000000000" \
  --job-type="csv_ingestion" \
  --payload='{"file_content_base64": "..."}'
```

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Worker Process                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Worker     │  │   Config     │  │   Job Repository     │   │
│  │   (worker.py)│  │   (config/)  │  │   (db/)              │   │
│  └──────┬───────┘  └──────────────┘  └──────────┬───────────┘   │
│         │                                        │              │
│         │     ┌──────────────┐                   │              │
│         └────▶│  Handlers    │◀──────────────────┘              │
│               │  (handlers/) │                                  │
│               └──────┬───────┘                                  │
│                      │                                          │
│         ┌────────────┼────────────┬──────────────┐             │
│         ▼            ▼            ▼              ▼             │
│  ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────────┐      │
│  │CSV       │  │PDF       │ │ML        │ │Excel         │      │
│  │Ingestion │  │Reports   │ │Scoring   │ │Export        │      │
│  └──────────┘  └──────────┘ └──────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     PostgreSQL (Supabase)     │
              │  ┌─────────────────────────┐  │
              │  │      python_jobs        │  │
              │  │  ┌───────────────────┐  │  │
              │  │  │  RLS Policies     │  │  │
              │  │  │  (tenant_id)      │  │  │
              │  │  └───────────────────┘  │  │
              │  └─────────────────────────┘  │
              │  ┌─────────────────────────┐  │
              │  │   python_job_attempts   │  │
              │  └─────────────────────────┘  │
              │  ┌─────────────────────────┐  │
              │  │   python_dead_letters   │  │
              │  └─────────────────────────┘  │
              └───────────────────────────────┘
```

### Job Lifecycle

```
┌─────────┐   claim   ┌──────────┐   success   ┌───────────┐
│ QUEUED  │ ─────────▶│ RUNNING  │ ───────────▶│ SUCCEEDED │
└────┬────┘           └────┬─────┘             └───────────┘
     │                     │
     │                     │ fail (retryable)
     │                     │
     │◀────────────────────┘ (exponential backoff)
     │
     │ fail (max attempts)
     ▼
┌─────────┐
│  DEAD   │ ─────────▶  python_dead_letters table
└─────────┘
```

### Key Components

#### Worker (`worker.py`)

- Polls database for available jobs
- Claims jobs with optimistic locking (`FOR UPDATE SKIP LOCKED`)
- Routes jobs to registered handlers based on `JobType`
- Handles graceful shutdown on SIGTERM/SIGINT
- Tracks metrics, heartbeats, and processing stats

#### Job Repository (`db/__init__.py`)

- PostgreSQL-backed job queue with connection pooling
- Tenant isolation via RLS (Row Level Security)
- Exponential backoff retry logic with configurable parameters
- Dead letter queue for jobs that exceed max attempts
- Stale lock recovery for crashed workers

#### Handlers (`handlers/`)

- **CSV Ingestion** - Robust parsing with encoding detection, column auto-mapping, date normalization, amount standardization
- Additional handlers for JSON, PDF reports, Excel exports, ML scoring

#### Models (`models/__init__.py`)

- `Job` - Core job entity with execution tracking
- `JobType` - Supported job types enum
- `JobStatus` - Job lifecycle states (queued, running, succeeded, failed, dead)
- `JobResult` - Handler execution results
- `WorkerHeartbeat` - Health monitoring data

#### Configuration (`config/__init__.py`)

- Pydantic-based settings with environment variable validation
- Environment prefix `WORKHORSE_`
- Feature flags for selective handler enabling
- Database connection pool configuration

### Database Schema

```sql
-- Main job queue table (with RLS)
CREATE TABLE python_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workspace_id UUID,
    job_type VARCHAR NOT NULL,
    payload JSONB DEFAULT '{}',
    status VARCHAR NOT NULL DEFAULT 'queued',
    priority INTEGER DEFAULT 100,
    idempotency_key VARCHAR(255) UNIQUE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    available_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by VARCHAR(255),
    result JSONB,
    records_processed INTEGER,
    records_failed INTEGER,
    last_error JSONB,
    error_message TEXT
);

-- Job attempt tracking for debugging
CREATE TABLE python_job_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES python_jobs(id) ON DELETE CASCADE,
    attempt_no INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    ok BOOLEAN,
    error JSONB,
    worker_id VARCHAR(255),
    correlation_id VARCHAR(255)
);

-- Dead letter queue for failed jobs
CREATE TABLE python_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    workspace_id UUID,
    job_type VARCHAR NOT NULL,
    payload JSONB NOT NULL,
    error JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE python_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON python_jobs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Retry Strategy

Workhorse implements exponential backoff with configurable parameters:

```python
backoff_seconds = min(
    base_seconds * (multiplier ** (attempts - 1)),
    max_seconds
)
```

**Default:** 1s → 2s → 4s (max 5 minutes)

### Security Features

- **Tenant Isolation**: Row-level security policies enforced at database level via `app.current_tenant_id`
- **Idempotency**: Safe retries with idempotency keys prevent duplicate processing
- **Input Validation**: Pydantic models validate all inputs at boundaries
- **No Secrets in Logs**: Credentials and PII are never logged to structured logs
- **Lock Timeouts**: Prevents stuck jobs from indefinitely blocking the queue
- **Connection Pooling**: Secure database connection management with psycopg

## Job Handlers

### Built-in Handlers

| Job Type               | Description                   | Required Payload                                  | Dependencies              |
| ---------------------- | ----------------------------- | ------------------------------------------------- | ------------------------- |
| `csv_ingestion`        | Import CSV with auto-mapping  | `file_path`, `file_url`, or `file_content_base64` | pandas, chardet, dateutil |
| `json_ingestion`       | JSON with schema validation   | `data` or `file_path`                             | -                         |
| `pdf_report`           | PDF generation with charts    | `report_type`, `filters`                          | reportlab, matplotlib     |
| `excel_export`         | Excel with formatting         | `query`, `format`                                 | openpyxl                  |
| `daily_report`         | Aggregated analytics reports  | `recipients`, `format`                            | pandas, matplotlib        |
| `reconciliation_batch` | ML-based matching             | `batch_id`, `parameters`                          | scikit-learn              |
| `anomaly_detection`    | Statistical anomaly detection | `dataset_id`, `sensitivity`                       | scipy                     |
| `data_quality_check`   | Data validation rules         | `rules`, `dataset_id`                             | pandas                    |
| `custom`               | User-defined handlers         | Defined by implementation                         | -                         |

### Creating Custom Handlers

```python
from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.worker import register_handler

@register_handler(JobType.CUSTOM)
def my_custom_handler(job: Job) -> JobResult:
    """Custom job handler implementation.

    Args:
        job: Job instance with payload data

    Returns:
        JobResult with success status and output data
    """
    # Your processing logic
    processed = process_data(job.payload)

    return JobResult(
        success=True,
        records_processed=len(processed),
        data={"result": processed},
        output_location="/storage/output.json",
    )
```

## Monitoring

### Health Checks

```bash
# Check database connectivity
settler-worker health

# Maintenance tasks (release stale locks)
settler-worker maintenance --release-stale --lock-timeout 300
```

### Prometheus Metrics

The worker exposes Prometheus metrics when `WORKHORSE_ENABLE_METRICS=true`:

| Metric                                 | Type      | Description              |
| -------------------------------------- | --------- | ------------------------ |
| `settler_jobs_processed_total`         | Counter   | Total jobs processed     |
| `settler_jobs_failed_total`            | Counter   | Total job failures       |
| `settler_job_duration_seconds`         | Histogram | Job processing duration  |
| `settler_worker_poll_interval_seconds` | Gauge     | Time between queue polls |
| `settler_jobs_in_queue`                | Gauge     | Current queue depth      |

Access metrics at `http://localhost:9090/metrics`

### Structured Logging

All logs are structured JSON with correlation IDs:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Job succeeded",
  "worker_id": "worker-01",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_type": "csv_ingestion",
  "tenant_id": "...",
  "correlation_id": "abc123",
  "processing_time_ms": 1250,
  "records_processed": 1000
}
```

## Integration with Next.js

The workhorse is **completely optional**. The existing Next.js app continues to work without it.

To enable Python processing:

1. **Apply migrations**: Run the SQL migration to create `python_jobs` tables

   ```bash
   supabase db push
   ```

2. **Start worker**: Run `settler-worker worker` in production

3. **Enqueue jobs**: Use the `enqueuePythonJob()` server action from TypeScript

4. **Monitor**: Check job status via `getPythonJob()`

## Troubleshooting

### Worker Won't Start

```bash
# Check environment
settler-worker health

# Validate configuration
python -c "from settler_workhorse.config import get_settings; print(get_settings().model_dump())"

# Check required env vars
python -c "from settler_workhorse.config import validate_environment; print(validate_environment())"
```

### Jobs Not Processing

```bash
# Check queue stats
settler-worker maintenance

# Release stale locks from crashed workers
settler-worker maintenance --release-stale

# Check for errors in logs
tail -f /var/log/settler/worker.log | grep ERROR
```

### Database Connection Issues

Ensure `DATABASE_URL` uses the **service role key** (not anon key) for write access:

```bash
# Correct (service role key)
DATABASE_URL=postgresql://postgres:[service-role-key]@db.xxx.supabase.co:5432/postgres

# Incorrect (anon key - read-only)
DATABASE_URL=postgresql://postgres:[anon-key]@db.xxx.supabase.co:5432/postgres
```

### CSV Ingestion Failures

Common issues and solutions:

1. **Encoding detection fails**: Manually specify encoding in column mapping
2. **Date format not recognized**: Use ISO 8601 format (YYYY-MM-DD)
3. **Amount parsing errors**: Remove currency symbols or use standard format

## Contributing

1. Follow the existing code style (`black`, `ruff`, `mypy`)
2. Add tests for new handlers (unit + integration)
3. Update this README with new features
4. Ensure migrations are reversible
5. Run all quality checks before submitting:
   ```bash
   black --check src/ tests/ && ruff check src/ tests/ && mypy src/
   ```

## License

MIT License - See [LICENSE](../../LICENSE) for details.

## Support

- Documentation: https://docs.settler.dev
- Issues: https://github.com/settlerdev/settler/issues
- Email: engineering@settler.dev

---

**Questions?** Contact engineering@settler.dev or open an issue.
