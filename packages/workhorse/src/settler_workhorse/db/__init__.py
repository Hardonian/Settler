"""Database layer for job queue operations with RLS compliance."""

import json
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, Generator, List, Optional, Tuple
from uuid import UUID

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from settler_workhorse.config import Settings, get_settings
from settler_workhorse.models import (
    DeadLetter,
    Job,
    JobAttempt,
    JobEnqueueRequest,
    JobResult,
    JobStats,
    JobStatus,
    JobType,
)


class DatabaseError(Exception):
    """Database operation error."""

    pass


class TenantContextError(Exception):
    """Tenant context not set for RLS."""

    pass


class JobRepository:
    """Repository for job queue operations with tenant isolation."""

    def __init__(self, pool: ConnectionPool, settings: Optional[Settings] = None):
        self.pool = pool
        self.settings = settings or get_settings()

    @contextmanager
    def _connection(self) -> Generator[psycopg.Connection, None, None]:
        """Get a connection from the pool."""
        conn = self.pool.getconn()
        try:
            yield conn
        finally:
            self.pool.putconn(conn)

    def _set_tenant_context(self, conn: psycopg.Connection, tenant_id: UUID) -> None:
        """Set tenant context for RLS policies."""
        with conn.cursor() as cur:
            cur.execute(
                "SELECT set_config('app.current_tenant_id', %s, true)",
                (str(tenant_id),),
            )

    def claim_next_job(
        self,
        worker_id: str,
        lock_timeout_seconds: int = 300,
        supported_job_types: Optional[List[JobType]] = None,
    ) -> Optional[Job]:
        """Claim the next available job with optimistic locking.

        Args:
            worker_id: Unique identifier for this worker instance
            lock_timeout_seconds: How long before a lock is considered expired
            supported_job_types: Optional filter for job types this worker can handle

        Returns:
            Job if claimed successfully, None if no jobs available
        """
        lock_cutoff = datetime.utcnow() - timedelta(seconds=lock_timeout_seconds)

        query = sql.SQL("""
            WITH next_job AS (
                SELECT id, tenant_id
                FROM python_jobs
                WHERE status = 'queued'
                    AND (available_at IS NULL OR available_at <= NOW())
                    AND (
                        locked_at IS NULL
                        OR locked_at < %(lock_cutoff)s
                    )
                    {job_type_filter}
                ORDER BY priority ASC, created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            ),
            claimed AS (
                UPDATE python_jobs
                SET status = 'running',
                    locked_at = NOW(),
                    locked_by = %(worker_id)s,
                    started_at = NOW(),
                    attempts = attempts + 1
                FROM next_job
                WHERE python_jobs.id = next_job.id
                    AND python_jobs.status = 'queued'
                RETURNING python_jobs.*
            )
            SELECT * FROM claimed;
            """)

        # Build job type filter if specified
        job_type_filter = sql.SQL("")
        if supported_job_types:
            types_str = [t.value for t in supported_job_types]
            job_type_filter = sql.SQL("AND job_type = ANY(%(job_types)s)")

        query = query.format(job_type_filter=job_type_filter)

        with self._connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                params = {
                    "worker_id": worker_id,
                    "lock_cutoff": lock_cutoff,
                }
                if supported_job_types:
                    params["job_types"] = types_str

                cur.execute(query, params)
                row = cur.fetchone()

                if not row:
                    return None

                # Set tenant context for any subsequent operations
                self._set_tenant_context(conn, row["tenant_id"])
                conn.commit()

                return Job.model_validate(row)

    def complete_job(
        self,
        job_id: UUID,
        result: JobResult,
        worker_id: str,
    ) -> bool:
        """Mark a job as completed successfully.

        Args:
            job_id: Job identifier
            result: Job execution result
            worker_id: Worker that processed the job

        Returns:
            True if job was updated successfully
        """
        query = """
            UPDATE python_jobs
            SET status = 'succeeded',
                completed_at = NOW(),
                locked_at = NULL,
                locked_by = NULL,
                result = %(result)s,
                records_processed = %(records_processed)s,
                records_failed = %(records_failed)s,
                output_location = %(output_location)s,
                updated_at = NOW()
            WHERE id = %(job_id)s
                AND locked_by = %(worker_id)s
            RETURNING id;
        """

        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    {
                        "job_id": str(job_id),
                        "worker_id": worker_id,
                        "result": json.dumps(result.data) if result.data else None,
                        "records_processed": result.records_processed,
                        "records_failed": result.records_failed,
                        "output_location": result.output_location,
                    },
                )
                row = cur.fetchone()
                conn.commit()
                return row is not None

    def fail_job(
        self,
        job_id: UUID,
        error: Exception,
        worker_id: str,
        schedule_retry: bool = True,
    ) -> Tuple[bool, bool]:
        """Mark a job as failed, optionally scheduling retry.

        Args:
            job_id: Job identifier
            error: Exception that caused failure
            worker_id: Worker that processed the job
            schedule_retry: Whether to schedule a retry attempt

        Returns:
            Tuple of (updated_successfully, will_retry)
        """
        error_data = {
            "message": str(error),
            "type": error.__class__.__name__,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Get current job state to check attempts
        with self._connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT attempts, max_attempts, tenant_id, job_type, payload, workspace_id
                    FROM python_jobs
                    WHERE id = %(job_id)s AND locked_by = %(worker_id)s
                    FOR UPDATE;
                    """,
                    {"job_id": str(job_id), "worker_id": worker_id},
                )
                job_row = cur.fetchone()

                if not job_row:
                    return (False, False)

                current_attempts = job_row["attempts"]
                max_attempts = job_row["max_attempts"]
                can_retry = schedule_retry and current_attempts < max_attempts

                if can_retry:
                    # Schedule retry with exponential backoff
                    backoff_seconds = min(
                        self.settings.retry_backoff_base_seconds
                        * (self.settings.retry_backoff_multiplier ** (current_attempts - 1)),
                        self.settings.retry_backoff_max_seconds,
                    )
                    available_at = datetime.utcnow() + timedelta(seconds=backoff_seconds)

                    cur.execute(
                        """
                        UPDATE python_jobs
                        SET status = 'queued',
                            available_at = %(available_at)s,
                            last_error = %(error)s,
                            error_message = %(error_message)s,
                            locked_at = NULL,
                            locked_by = NULL,
                            updated_at = NOW()
                        WHERE id = %(job_id)s;
                        """,
                        {
                            "job_id": str(job_id),
                            "available_at": available_at,
                            "error": json.dumps(error_data),
                            "error_message": str(error)[:500],
                        },
                    )
                else:
                    # Move to dead letter state
                    cur.execute(
                        """
                        UPDATE python_jobs
                        SET status = 'dead',
                            completed_at = NOW(),
                            last_error = %(error)s,
                            error_message = %(error_message)s,
                            locked_at = NULL,
                            locked_by = NULL,
                            updated_at = NOW()
                        WHERE id = %(job_id)s;
                        """,
                        {
                            "job_id": str(job_id),
                            "error": json.dumps(error_data),
                            "error_message": str(error)[:500],
                        },
                    )

                    # Create dead letter entry
                    cur.execute(
                        """
                        INSERT INTO python_dead_letters (
                            job_id, tenant_id, workspace_id, job_type,
                            payload, error, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, NOW());
                        """,
                        (
                            str(job_id),
                            str(job_row["tenant_id"]),
                            str(job_row["workspace_id"]) if job_row["workspace_id"] else None,
                            job_row["job_type"],
                            json.dumps(job_row["payload"]),
                            json.dumps(error_data),
                        ),
                    )

                conn.commit()
                return (True, can_retry)

    def record_attempt(
        self,
        job_id: UUID,
        attempt_no: int,
        worker_id: str,
        correlation_id: Optional[str] = None,
    ) -> None:
        """Record the start of a job attempt.

        Args:
            job_id: Job identifier
            attempt_no: Attempt number (1-indexed)
            worker_id: Worker processing the job
            correlation_id: Optional correlation ID for tracing
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO python_job_attempts (
                        job_id, attempt_no, started_at, worker_id, correlation_id
                    ) VALUES (%s, %s, NOW(), %s, %s);
                    """,
                    (str(job_id), attempt_no, worker_id, correlation_id),
                )
                conn.commit()

    def complete_attempt(
        self,
        job_id: UUID,
        attempt_no: int,
        success: bool,
        error: Optional[Exception] = None,
    ) -> None:
        """Complete a job attempt record.

        Args:
            job_id: Job identifier
            attempt_no: Attempt number
            success: Whether the attempt succeeded
            error: Exception if attempt failed
        """
        error_data = None
        if error:
            error_data = json.dumps(
                {
                    "message": str(error),
                    "type": error.__class__.__name__,
                }
            )

        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE python_job_attempts
                    SET finished_at = NOW(),
                        ok = %(success)s,
                        error = %(error)s
                    WHERE job_id = %(job_id)s
                        AND attempt_no = %(attempt_no)s;
                    """,
                    {
                        "job_id": str(job_id),
                        "attempt_no": attempt_no,
                        "success": success,
                        "error": error_data,
                    },
                )
                conn.commit()

    def enqueue(
        self,
        tenant_id: UUID,
        request: JobEnqueueRequest,
        workspace_id: Optional[UUID] = None,
    ) -> Job:
        """Enqueue a new job.

        Args:
            tenant_id: Tenant identifier (for RLS)
            request: Job enqueue request
            workspace_id: Optional workspace identifier

        Returns:
            Created Job
        """
        available_at = datetime.utcnow()
        if request.delay_seconds > 0:
            available_at = available_at + timedelta(seconds=request.delay_seconds)

        with self._connection() as conn:
            # Set tenant context for RLS
            self._set_tenant_context(conn, tenant_id)

            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    INSERT INTO python_jobs (
                        tenant_id, workspace_id, job_type, payload,
                        priority, idempotency_key, max_attempts,
                        available_at, status, attempts, created_at
                    ) VALUES (
                        %(tenant_id)s, %(workspace_id)s, %(job_type)s, %(payload)s,
                        %(priority)s, %(idempotency_key)s, %(max_attempts)s,
                        %(available_at)s, 'queued', 0, NOW()
                    )
                    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
                    DO UPDATE SET
                        updated_at = NOW()
                    RETURNING *;
                    """,
                    {
                        "tenant_id": str(tenant_id),
                        "workspace_id": str(workspace_id) if workspace_id else None,
                        "job_type": request.job_type.value,
                        "payload": json.dumps(request.payload),
                        "priority": request.priority,
                        "idempotency_key": request.idempotency_key,
                        "max_attempts": request.max_attempts,
                        "available_at": available_at,
                    },
                )
                row = cur.fetchone()
                conn.commit()

                if not row:
                    raise DatabaseError("Failed to enqueue job")

                return Job.model_validate(row)

    def get_job(self, job_id: UUID, tenant_id: UUID) -> Optional[Job]:
        """Get a job by ID with tenant isolation.

        Args:
            job_id: Job identifier
            tenant_id: Tenant identifier (for RLS)

        Returns:
            Job if found and accessible, None otherwise
        """
        with self._connection() as conn:
            self._set_tenant_context(conn, tenant_id)

            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    "SELECT * FROM python_jobs WHERE id = %s;",
                    (str(job_id),),
                )
                row = cur.fetchone()
                return Job.model_validate(row) if row else None

    def get_job_stats(self, tenant_id: Optional[UUID] = None) -> JobStats:
        """Get job queue statistics.

        Args:
            tenant_id: Optional tenant filter

        Returns:
            Job statistics
        """
        query = """
            SELECT
                COUNT(*) FILTER (WHERE status = 'queued') as queued,
                COUNT(*) FILTER (WHERE status = 'running') as running,
                COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status = 'dead') as dead,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
            FROM python_jobs
            {tenant_filter};
        """

        tenant_filter = ""
        params: Dict[str, Any] = {}

        if tenant_id:
            tenant_filter = "WHERE tenant_id = %(tenant_id)s"
            params["tenant_id"] = str(tenant_id)

        query = query.format(tenant_filter=tenant_filter)

        with self._connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, params)
                row = cur.fetchone()
                return JobStats.model_validate(row)

    def release_stale_locks(self, lock_timeout_seconds: int) -> int:
        """Release locks held by workers that appear to have crashed.

        Args:
            lock_timeout_seconds: How long before a lock is considered stale

        Returns:
            Number of locks released
        """
        lock_cutoff = datetime.utcnow() - timedelta(seconds=lock_timeout_seconds)

        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE python_jobs
                    SET status = 'queued',
                        locked_at = NULL,
                        locked_by = NULL,
                        available_at = GREATEST(available_at, NOW()),
                        updated_at = NOW()
                    WHERE status = 'running'
                        AND locked_at < %(cutoff)s;
                    """,
                    {"cutoff": lock_cutoff},
                )
                released = cur.rowcount
                conn.commit()
                return released

    def cancel_job(self, job_id: UUID, tenant_id: UUID) -> bool:
        """Cancel a queued or running job.

        Args:
            job_id: Job identifier
            tenant_id: Tenant identifier (for RLS)

        Returns:
            True if job was cancelled
        """
        with self._connection() as conn:
            self._set_tenant_context(conn, tenant_id)

            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE python_jobs
                    SET status = 'cancelled',
                        locked_at = NULL,
                        locked_by = NULL,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE id = %(job_id)s
                        AND status IN ('queued', 'running');
                    """,
                    {"job_id": str(job_id)},
                )
                cancelled = cur.rowcount > 0
                conn.commit()
                return cancelled


def create_connection_pool(settings: Optional[Settings] = None) -> ConnectionPool:
    """Create a database connection pool.

    Args:
        settings: Application settings

    Returns:
        Configured connection pool
    """
    settings = settings or get_settings()

    pool = ConnectionPool(
        str(settings.database_url),
        min_size=5,
        max_size=settings.database_pool_size,
        kwargs={"row_factory": dict_row},
    )

    return pool
