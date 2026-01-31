"""Worker implementation for processing Python jobs."""

import signal
import sys
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Type

from settler_workhorse.config import Settings, get_settings
from settler_workhorse.db import JobRepository, create_connection_pool
from settler_workhorse.models import Job, JobResult, JobStatus, JobType, WorkerHeartbeat
from settler_workhorse.utils.logging import (
    LogContext,
    bind_context,
    generate_correlation_id,
    get_logger,
)

# Registry of job handlers
JobHandler = Callable[[Job], JobResult]
HANDLER_REGISTRY: Dict[JobType, JobHandler] = {}


def register_handler(job_type: JobType) -> Callable[[JobHandler], JobHandler]:
    """Decorator to register a job handler.

    Args:
        job_type: Job type to handle

    Returns:
        Decorator function
    """

    def decorator(func: JobHandler) -> JobHandler:
        HANDLER_REGISTRY[job_type] = func
        return func

    return decorator


class WorkerShutdown(Exception):
    """Exception to signal graceful shutdown."""

    pass


class Worker:
    """Background worker for processing Python jobs."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        job_repository: Optional[JobRepository] = None,
    ):
        self.settings = settings or get_settings()
        self.worker_id = self.settings.effective_worker_id
        self.logger = get_logger("worker", worker_id=self.worker_id)

        # Initialize database connection
        if job_repository:
            self.jobs = job_repository
        else:
            pool = create_connection_pool(self.settings)
            self.jobs = JobRepository(pool, self.settings)

        # State
        self.running = False
        self.shutting_down = False
        self.jobs_processed = 0
        self.jobs_failed = 0
        self.current_job: Optional[Job] = None
        self.started_at: Optional[datetime] = None

        # Supported job types (filter to enabled types)
        self.supported_job_types = self._get_supported_job_types()

        # Setup signal handlers
        self._setup_signal_handlers()

    def _get_supported_job_types(self) -> List[JobType]:
        """Get list of job types this worker can handle."""
        types = []

        if self.settings.enable_csv_ingestion:
            types.append(JobType.CSV_INGESTION)
        if self.settings.enable_json_ingestion:
            types.append(JobType.JSON_INGESTION)
        if self.settings.enable_pdf_reports:
            types.append(JobType.PDF_REPORT)
        if self.settings.enable_excel_exports:
            types.append(JobType.EXCEL_EXPORT)
        if self.settings.enable_anomaly_detection:
            types.append(JobType.ANOMALY_DETECTION)
        if self.settings.enable_ml_scoring:
            types.append(JobType.RECONCILIATION_BATCH)

        # Always support custom and daily report
        types.extend([JobType.CUSTOM, JobType.DAILY_REPORT, JobType.DATA_QUALITY_CHECK])

        # Phase 2 - New job types (always enabled)
        types.extend(
            [
                JobType.INGEST_NORMALIZE,
                JobType.RECON_RUN,
                JobType.ANOMALY_SCORE,
                JobType.EVAL_RUN,
            ]
        )

        # Phase 4 - Real work job types (always enabled)
        types.extend(
            [
                JobType.VARIANCE_REPORT,
                JobType.TRANSACTION_MATCH,
            ]
        )

        # Phase 6 - Shared/core jobs (always enabled)
        types.extend(
            [
                JobType.BATCH_BACKFILL,
                JobType.REPORT_GENERATE,
                JobType.ML_FEATURES_BUILD,
            ]
        )

        # Phase 6 - Settler-specific jobs (always enabled)
        types.extend(
            [
                JobType.AUDIT_TRAIL_EXPORT,
            ]
        )

        # Phase 7 - Client-facing import/export jobs (always enabled)
        types.extend(
            [
                JobType.EXPORT_CSV,
                JobType.EXPORT_EXCEL,
                JobType.EXPORT_PDF,
                JobType.IMPORT_VALIDATE,
                JobType.IMPORT_PROCESS,
            ]
        )

        # Phase 7 - Receipt processing jobs (always enabled)
        types.extend(
            [
                JobType.RECEIPT_OCR,
                JobType.RECEIPT_EXTRACT,
                JobType.RECEIPT_MATCH,
            ]
        )

        return types

    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        signal.signal(signal.SIGTERM, self._handle_shutdown_signal)
        signal.signal(signal.SIGINT, self._handle_shutdown_signal)

    def _handle_shutdown_signal(self, signum: int, frame: Any) -> None:
        """Handle shutdown signal.

        Args:
            signum: Signal number
            frame: Current stack frame
        """
        sig_name = signal.Signals(signum).name
        self.logger.info(f"Received {sig_name}, initiating graceful shutdown")
        self.shutting_down = True

    def _get_handler(self, job_type: JobType) -> Optional[JobHandler]:
        """Get handler for job type.

        Args:
            job_type: Job type

        Returns:
            Handler function or None
        """
        return HANDLER_REGISTRY.get(job_type)

    def _execute_job(self, job: Job) -> JobResult:
        """Execute a job with the appropriate handler.

        Args:
            job: Job to execute

        Returns:
            Job execution result

        Raises:
            Exception: If job handler fails
        """
        handler = self._get_handler(job.job_type)

        if not handler:
            raise NotImplementedError(f"No handler registered for job type: {job.job_type}")

        self.logger.info(f"Executing job", job_type=job.job_type.value, attempt=job.attempts + 1)

        start_time = time.time()
        result = handler(job)
        elapsed_ms = int((time.time() - start_time) * 1000)

        result.processing_time_ms = elapsed_ms

        self.logger.info(
            f"Job {'succeeded' if result.success else 'failed'}",
            success=result.success,
            processing_time_ms=elapsed_ms,
            records_processed=result.records_processed,
        )

        return result

    def _process_single_job(self) -> bool:
        """Process a single job from the queue.

        Returns:
            True if a job was processed, False if queue empty
        """
        # Check for shutdown
        if self.shutting_down:
            raise WorkerShutdown("Shutdown requested")

        # Claim next job
        job = self.jobs.claim_next_job(
            worker_id=self.worker_id,
            lock_timeout_seconds=self.settings.worker_lock_timeout_seconds,
            supported_job_types=self.supported_job_types,
        )

        if not job:
            return False

        self.current_job = job
        correlation_id = generate_correlation_id()

        with LogContext(
            job_id=str(job.id),
            job_type=job.job_type.value,
            tenant_id=str(job.tenant_id),
            correlation_id=correlation_id,
        ):
            self.logger.info("Processing job", attempt=job.attempts + 1)

            try:
                # Record attempt start
                self.jobs.record_attempt(
                    job_id=job.id,
                    attempt_no=job.attempts,
                    worker_id=self.worker_id,
                    correlation_id=correlation_id,
                )

                # Execute job
                result = self._execute_job(job)

                if result.success:
                    # Mark as succeeded
                    self.jobs.complete_job(job.id, result, self.worker_id)
                    self.jobs.complete_attempt(job.id, job.attempts, success=True)
                    self.jobs_processed += 1
                else:
                    # Handler returned failure (not exception)
                    error = Exception(result.error or "Job handler reported failure")
                    updated, will_retry = self.jobs.fail_job(
                        job.id, error, self.worker_id, schedule_retry=True
                    )
                    self.jobs.complete_attempt(job.id, job.attempts, success=False, error=error)
                    if not will_retry:
                        self.jobs_failed += 1

            except Exception as e:
                self.logger.error("Job execution failed", exc_info=True)

                updated, will_retry = self.jobs.fail_job(
                    job.id, e, self.worker_id, schedule_retry=True
                )
                self.jobs.complete_attempt(job.id, job.attempts, success=False, error=e)
                if not will_retry:
                    self.jobs_failed += 1

            finally:
                self.current_job = None
                clear_context()

        return True

    def run_once(self) -> bool:
        """Run a single job processing cycle.

        Returns:
            True if a job was processed
        """
        try:
            return self._process_single_job()
        except WorkerShutdown:
            raise
        except Exception as e:
            self.logger.error("Error in job processing cycle", exc_info=True)
            return False

    def run(self) -> None:
        """Run the worker continuously until shutdown."""
        self.running = True
        self.started_at = datetime.utcnow()

        self.logger.info(
            "Worker started",
            supported_types=[t.value for t in self.supported_job_types],
            poll_interval=self.settings.worker_poll_interval_seconds,
        )

        try:
            while self.running and not self.shutting_down:
                processed = self.run_once()

                if not processed and not self.shutting_down:
                    # No jobs available, wait before polling again
                    time.sleep(self.settings.worker_poll_interval_seconds)

        except WorkerShutdown:
            self.logger.info("Worker shutting down gracefully")

        except Exception as e:
            self.logger.error("Worker encountered fatal error", exc_info=True)
            sys.exit(1)

        finally:
            self.running = False
            self._cleanup()

    def _cleanup(self) -> None:
        """Cleanup resources during shutdown."""
        self.logger.info(
            "Worker cleanup complete",
            jobs_processed=self.jobs_processed,
            jobs_failed=self.jobs_failed,
            uptime_seconds=(datetime.utcnow() - self.started_at).seconds if self.started_at else 0,
        )

    def get_heartbeat(self) -> WorkerHeartbeat:
        """Get current worker heartbeat status.

        Returns:
            Worker heartbeat
        """
        return WorkerHeartbeat(
            worker_id=self.worker_id,
            status=(
                "shutting_down"
                if self.shutting_down
                else ("busy" if self.current_job else "healthy")
            ),
            jobs_processed=self.jobs_processed,
            jobs_failed=self.jobs_failed,
            current_job_id=self.current_job.id if self.current_job else None,
            last_heartbeat=datetime.utcnow(),
            version=self.settings.service_version,
        )


def clear_context():
    from settler_workhorse.utils.logging import clear_context as _clear

    _clear()
